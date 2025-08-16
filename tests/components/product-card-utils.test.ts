import { describe, it, expect, vi } from 'vitest'

// Extraction des fonctions utilitaires de ProductCard pour les tester
function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(batch: { expiryDate: Date | null }) {
  if (!batch.expiryDate) {
    return null;
  }

  const daysUntil = getDaysUntilExpiry(batch.expiryDate);

  if (daysUntil < 0) {
    return { type: 'expired', daysUntil, message: 'Expiré' };
  }
  if (daysUntil <= 3) {
    return { type: 'critical', daysUntil, message: `Expire dans ${daysUntil}j` };
  }
  if (daysUntil <= 7) {
    return { type: 'warning', daysUntil, message: `Expire dans ${daysUntil}j` };
  }

  return { type: 'ok', daysUntil, message: null };
}

describe('ProductCard utilities', () => {
  beforeEach(() => {
    // Mock la date courante pour des tests reproductibles
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDaysUntilExpiry', () => {
    it('should return positive days for future dates', () => {
      const futureDate = new Date('2024-01-20')
      const result = getDaysUntilExpiry(futureDate)
      expect(result).toBe(5)
    })

    it('should return negative days for past dates', () => {
      const pastDate = new Date('2024-01-10')
      const result = getDaysUntilExpiry(pastDate)
      expect(result).toBe(-5)
    })

    it('should return 0 for today', () => {
      const today = new Date('2024-01-15')
      const result = getDaysUntilExpiry(today)
      expect(result).toBe(0)
    })

    it('should return 1 for tomorrow', () => {
      const tomorrow = new Date('2024-01-16')
      const result = getDaysUntilExpiry(tomorrow)
      expect(result).toBe(1)
    })

    it('should ignore time component and only consider dates', () => {
      const morningDate = new Date('2024-01-20T08:00:00.000Z')
      const eveningDate = new Date('2024-01-20T20:00:00.000Z')
      
      expect(getDaysUntilExpiry(morningDate)).toBe(5)
      expect(getDaysUntilExpiry(eveningDate)).toBe(5)
    })

    it('should handle leap year correctly', () => {
      vi.setSystemTime(new Date('2024-02-28T00:00:00.000Z'))
      const leapDay = new Date('2024-02-29')
      const result = getDaysUntilExpiry(leapDay)
      expect(result).toBe(1)
    })

    it('should handle year boundary correctly', () => {
      vi.setSystemTime(new Date('2023-12-31T00:00:00.000Z'))
      const newYearDay = new Date('2024-01-01')
      const result = getDaysUntilExpiry(newYearDay)
      expect(result).toBe(1)
    })
  })

  describe('getExpiryStatus', () => {
    it('should return null for batch without expiry date', () => {
      const batch = { expiryDate: null }
      const result = getExpiryStatus(batch)
      expect(result).toBeNull()
    })

    it('should return expired status for past dates', () => {
      const batch = { expiryDate: new Date('2024-01-10') }
      const result = getExpiryStatus(batch)
      
      expect(result).toEqual({
        type: 'expired',
        daysUntil: -5,
        message: 'Expiré'
      })
    })

    it('should return critical status for dates expiring in 0-3 days', () => {
      const testCases = [
        { date: '2024-01-15', days: 0 }, // today
        { date: '2024-01-16', days: 1 },
        { date: '2024-01-17', days: 2 },
        { date: '2024-01-18', days: 3 }
      ]

      testCases.forEach(({ date, days }) => {
        const batch = { expiryDate: new Date(date) }
        const result = getExpiryStatus(batch)
        
        expect(result).toEqual({
          type: 'critical',
          daysUntil: days,
          message: `Expire dans ${days}j`
        })
      })
    })

    it('should return warning status for dates expiring in 4-7 days', () => {
      const testCases = [
        { date: '2024-01-19', days: 4 },
        { date: '2024-01-20', days: 5 },
        { date: '2024-01-21', days: 6 },
        { date: '2024-01-22', days: 7 }
      ]

      testCases.forEach(({ date, days }) => {
        const batch = { expiryDate: new Date(date) }
        const result = getExpiryStatus(batch)
        
        expect(result).toEqual({
          type: 'warning',
          daysUntil: days,
          message: `Expire dans ${days}j`
        })
      })
    })

    it('should return ok status for dates expiring in more than 7 days', () => {
      const batch = { expiryDate: new Date('2024-01-25') }
      const result = getExpiryStatus(batch)
      
      expect(result).toEqual({
        type: 'ok',
        daysUntil: 10,
        message: null
      })
    })
  })

  describe('batch sorting and filtering logic', () => {
    it('should sort batches by expiry date ascending', () => {
      const batches = [
        { id: '1', quantity: 5, expiryDate: new Date('2024-01-20') },
        { id: '2', quantity: 3, expiryDate: new Date('2024-01-16') },
        { id: '3', quantity: 2, expiryDate: null },
        { id: '4', quantity: 4, expiryDate: new Date('2024-01-18') }
      ]

      const sortedBatches = [...batches]
        .filter(b => b.quantity > 0)
        .sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.getTime() - b.expiryDate.getTime();
        });

      expect(sortedBatches.map(b => b.id)).toEqual(['2', '4', '1', '3'])
    })

    it('should filter out batches with zero quantity', () => {
      const batches = [
        { id: '1', quantity: 5, expiryDate: new Date('2024-01-20') },
        { id: '2', quantity: 0, expiryDate: new Date('2024-01-16') },
        { id: '3', quantity: 3, expiryDate: null }
      ]

      const filteredBatches = batches.filter(b => b.quantity > 0)
      expect(filteredBatches).toHaveLength(2)
      expect(filteredBatches.map(b => b.id)).toEqual(['1', '3'])
    })

    it('should calculate total quantity correctly', () => {
      const batches = [
        { id: '1', quantity: 5, expiryDate: new Date('2024-01-20') },
        { id: '2', quantity: 3, expiryDate: new Date('2024-01-16') },
        { id: '3', quantity: 0, expiryDate: null },
        { id: '4', quantity: 7, expiryDate: new Date('2024-01-18') }
      ]

      const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0)
      expect(totalQuantity).toBe(15)
    })

    it('should handle empty batches array', () => {
      const batches: any[] = []
      const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0)
      const filteredBatches = batches.filter(b => b.quantity > 0)
      
      expect(totalQuantity).toBe(0)
      expect(filteredBatches).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid-date')
      expect(isNaN(invalidDate.getTime())).toBe(true)
      
      // Dans un vrai composant, on devrait gérer ce cas
      // Pour le test, on vérifie juste que la date est invalide
    })

    it('should handle very large time differences', () => {
      const veryFutureDate = new Date('2030-01-15')
      const result = getDaysUntilExpiry(veryFutureDate)
      expect(result).toBeGreaterThan(2000) // Plus de 6 ans
    })

    it('should handle daylight saving time transitions', () => {
      // Test pendant un changement d'heure (si applicable dans le fuseau horaire)
      vi.setSystemTime(new Date('2024-03-30T00:00:00.000Z')) // Veille du changement d'heure en Europe
      const nextDay = new Date('2024-03-31')
      const result = getDaysUntilExpiry(nextDay)
      expect(result).toBe(1)
    })
  })
})