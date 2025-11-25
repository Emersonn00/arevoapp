/**
 * Utility functions for date handling
 */

export function formatDateBR(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function isRegistrationOpen(
  startDate: string,
  endDate: string
): boolean {
  try {
    const now = new Date();
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
    
    return now >= start && now <= end;
  } catch {
    return false;
  }
}



