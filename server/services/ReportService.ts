import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export class ReportService {
  private readonly roomCol = 'rooms'
  private readonly contractCol = 'contracts'
  private readonly invoiceCol = 'invoices'
  private readonly paymentCol = 'payments'
  private readonly rentPriceCol = 'rent_prices'

  async getDashboard(propertyId?: string, year?: number, month?: number, userId?: string) {
    const db = await getDatabase()
    const roomQuery: any = {}
    if (propertyId) {
      roomQuery.propertyId = new ObjectId(propertyId)
    }

    const rooms = await db.collection(this.roomCol).find(roomQuery).toArray()
    const totalRooms = rooms.length
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
    const availableRooms = rooms.filter(r => r.status === 'available').length
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length
    const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2)) : 0

    // Billing status for the specified year/month
    const invoiceQuery: any = {}
    if (propertyId) invoiceQuery.propertyId = new ObjectId(propertyId)
    
    if (year && month) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      invoiceQuery.billingPeriod = monthStr
    } else if (year) {
      // Regex for the year
      invoiceQuery.billingPeriod = { $regex: `^${year}-` }
    }

    const invoices = await db.collection(this.invoiceCol).find(invoiceQuery).toArray()
    const billing = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      partial: invoices.filter(i => i.status === 'partial').length,
      unpaid: invoices.filter(i => i.status === 'unpaid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    }

    // Revenue calculations
    const totalInvoiceAmount = invoices.reduce((sum, i) => sum + (i.total || 0), 0)
    
    // Actual revenue from payments matching invoices
    const invoiceIds = invoices.map(i => i._id)
    const payments = invoiceIds.length > 0 
      ? await db.collection(this.paymentCol).find({ invoiceId: { $in: invoiceIds } }).toArray()
      : []
    const actualRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const outstanding = totalInvoiceAmount - actualRevenue

    return {
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        maintenance: maintenanceRooms
      },
      occupancyRate,
      revenue: {
        potential: totalInvoiceAmount * 1.1, // Estimation or derived
        expected: totalInvoiceAmount,
        actual: actualRevenue,
        outstanding
      },
      billing
    }
  }

  async getRevenueReport(propertyId?: string, year?: number, month?: number, dateFrom?: string, dateTo?: string) {
    const db = await getDatabase()
    const invoiceQuery: any = {}
    if (propertyId) invoiceQuery.propertyId = new ObjectId(propertyId)

    if (year && month) {
      invoiceQuery.billingPeriod = `${year}-${String(month).padStart(2, '0')}`
    } else if (year) {
      invoiceQuery.billingPeriod = { $regex: `^${year}-` }
    }

    const invoices = await db.collection(this.invoiceCol).find(invoiceQuery).toArray()
    const totalExpected = invoices.reduce((sum, i) => sum + (i.total || 0), 0)

    const invoiceIds = invoices.map(i => i._id)
    const payments = invoiceIds.length > 0 
      ? await db.collection(this.paymentCol).find({ invoiceId: { $in: invoiceIds } }).toArray()
      : []
    const actualRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const outstanding = totalExpected - actualRevenue

    return {
      potentialRevenue: totalExpected * 1.1,
      expectedRevenue: totalExpected,
      actualRevenue,
      outstanding,
      expenses: 0,
      netIncome: actualRevenue
    }
  }

  async getMonthlyRevenueReport(propertyId?: string, year?: number) {
    const db = await getDatabase()
    const invoiceQuery: any = {}
    if (propertyId) invoiceQuery.propertyId = new ObjectId(propertyId)
    if (year) invoiceQuery.billingPeriod = { $regex: `^${year}-` }

    const invoices = await db.collection(this.invoiceCol).find(invoiceQuery).toArray()
    const invoiceIds = invoices.map(i => i._id)
    const payments = invoiceIds.length > 0 
      ? await db.collection(this.paymentCol).find({ invoiceId: { $in: invoiceIds } }).toArray()
      : []

    const map: Record<string, { potential: number; expected: number; actual: number; outstanding: number }> = {}

    for (const inv of invoices) {
      const period = inv.billingPeriod || '2026-01'
      if (!map[period]) {
        map[period] = { potential: 0, expected: 0, actual: 0, outstanding: 0 }
      }
      map[period].expected += inv.total || 0
      map[period].potential += (inv.total || 0) * 1.1
    }

    for (const p of payments) {
      const inv = invoices.find(i => i._id.toString() === p.invoiceId.toString())
      if (inv) {
        const period = inv.billingPeriod || '2026-01'
        if (map[period]) {
          map[period].actual += p.amount || 0
        }
      }
    }

    return Object.keys(map).sort().map(month => {
      const data = map[month]
      return {
        month,
        potential: data.potential,
        expected: data.expected,
        actual: data.actual,
        outstanding: data.expected - data.actual
      }
    })
  }

  async getOccupancyReport(propertyId?: string, year?: number) {
    const db = await getDatabase()
    const roomQuery: any = {}
    if (propertyId) roomQuery.propertyId = new ObjectId(propertyId)
    const rooms = await db.collection(this.roomCol).find(roomQuery).toArray()
    const totalRooms = rooms.length

    // Generate monthly occupancy for the year
    const targetYear = year || new Date().getFullYear()
    const result = []

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${targetYear}-${String(m).padStart(2, '0')}`
      // Check contracts active in this month
      const startOfMonth = new Date(`${monthStr}-01`)
      const endOfMonth = new Date(targetYear, m, 0, 23, 59, 59)

      const contracts = await db.collection(this.contractCol).find({
        ...(propertyId ? { propertyId: new ObjectId(propertyId) } : {}),
        status: 'active',
        startDate: { $lte: endOfMonth },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: startOfMonth } }
        ]
      }).toArray()

      const occupiedRoomsSet = new Set(contracts.map(c => c.roomId.toString()))
      const occupiedCount = Math.min(occupiedRoomsSet.size, totalRooms)
      const rate = totalRooms > 0 ? Number(((occupiedCount / totalRooms) * 100).toFixed(2)) : 0

      result.push({
        month: monthStr,
        occupied: occupiedCount,
        total: totalRooms,
        rate
      })
    }

    return result
  }
}
