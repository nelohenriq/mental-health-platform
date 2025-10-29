import { expect } from '@jest/globals'
import { detectCrisisIndicators } from '@/lib/ai/prompts'

describe('Crisis Detection', () => {
  it('should detect crisis keywords in messages', () => {
    const crisisMessage = "I want to hurt myself"
    const result = detectCrisisIndicators(crisisMessage)
    expect(result).toBe(true)
  })

  it('should not detect crisis in normal messages', () => {
    const normalMessage = "I'm feeling a bit stressed today"
    const result = detectCrisisIndicators(normalMessage)
    expect(result).toBe(false)
  })

  it('should detect multiple crisis indicators', () => {
    const crisisMessage = "I feel like ending it all and harming myself"
    const result = detectCrisisIndicators(crisisMessage)
    expect(result).toBe(true)
  })

  it('should handle empty messages', () => {
    const result = detectCrisisIndicators('')
    expect(result).toBe(false)
  })

  it('should handle null/undefined messages', () => {
    const result = detectCrisisIndicators(null as any)
    expect(result).toBe(false)
  })
})