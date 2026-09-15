import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const TIMEZONE = 'Asia/Jakarta'

export function formatDate(date: Date | string, template = 'yyyy-MM-dd'): string {
  return format(new Date(date), template, { locale: idLocale })
}

export function getBillingPeriod(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM')
}

export function getMonthRange(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-').map(Number)
  return {
    start: startOfMonth(new Date(year, month - 1)),
    end: endOfMonth(new Date(year, month - 1)),
  }
}

export function getNextBillingDate(currentDate: Date | string, dueDay: number): Date {
  const date = new Date(currentDate)
  const month = date.getMonth()
  const year = date.getFullYear()
  const candidate = new Date(year, month, dueDay)

  if (candidate >= date) return candidate
  return new Date(year, month + 1, dueDay)
}

export function getPreviousBillingDate(currentDate: Date | string, dueDay: number): Date {
  const date = new Date(currentDate)
  const month = date.getMonth()
  const year = date.getFullYear()
  const candidate = new Date(year, month, dueDay)

  if (candidate < date) return candidate
  return subMonths(candidate, 1)
}

export function isOverdue(dueDate: Date | string, referenceDate: Date = new Date()): boolean {
  return new Date(dueDate) < referenceDate
}
