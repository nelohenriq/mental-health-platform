import { segmentUsersByActivity, segmentUsersByMood } from '@/lib/analytics/segmentation'

describe('User Segmentation', () => {
  describe('segmentUsersByActivity', () => {
    it('should segment users by activity level', () => {
      const users = [
        { userId: '1', activityCount: 60 },
        { userId: '2', activityCount: 30 },
        { userId: '3', activityCount: 10 },
      ]

      const segments = segmentUsersByActivity(users)

      const highlyActive = segments.filter(s => s.segment === 'HIGH').map(s => s.userId)
      const moderatelyActive = segments.filter(s => s.segment === 'MEDIUM').map(s => s.userId)
      const inactive = segments.filter(s => s.segment === 'LOW').map(s => s.userId)

      expect(highlyActive).to.contain('1')
      expect(moderatelyActive).to.contain('2')
      expect(inactive).to.contain('3')
    })

    it('should handle empty user list', () => {
      const segments = segmentUsersByActivity([])
      expect(segments).to.have.length(0)
    })
  })

  describe('segmentUsersByMood', () => {
    it('should segment users by average mood', () => {
      const users = [
        { userId: '1', averageMood: 8.5, moodVariance: 1 },
        { userId: '2', averageMood: 6.0, moodVariance: 1 },
        { userId: '3', averageMood: 3.5, moodVariance: 1 },
      ]

      const segments = segmentUsersByMood(users)

      const highMood = segments.filter(s => s.segment === 'HIGH_MOOD').map(s => s.userId)
      const stableMood = segments.filter(s => s.segment === 'STABLE_MOOD').map(s => s.userId)
      const lowMood = segments.filter(s => s.segment === 'LOW_MOOD').map(s => s.userId)

      expect(highMood).to.contain('1')
      expect(stableMood).to.contain('2')
      expect(lowMood).to.contain('3')
    })

    it('should handle users with no mood data', () => {
      const users = [
        { userId: '1', averageMood: 0, moodVariance: 0 },
        { userId: '2', averageMood: 0, moodVariance: 0 },
      ]

      const segments = segmentUsersByMood(users)
      expect(segments).to.have.length(2)
    })
  })
})