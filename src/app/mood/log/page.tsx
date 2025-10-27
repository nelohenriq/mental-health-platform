"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoodScale } from "@/components/ui/mood-scale"
import { FactorSelector } from "@/components/ui/factor-selector"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Calendar } from "lucide-react"

export default function MoodLogPage() {
  const router = useRouter()
  const [moodLevel, setMoodLevel] = useState<number>(0)
  const [factors, setFactors] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (moodLevel === 0) {
      setError("Please select a mood level")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/mood/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moodLevel,
          factors,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save mood entry")
      }

      setSuccess(true)

      // Reset form
      setMoodLevel(0)
      setFactors([])
      setNotes("")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Save className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Mood Logged Successfully!</h2>
                <p className="text-gray-600 mt-2">
                  Your mood entry has been saved. Taking care of your mental health is important.
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                View Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How are you feeling today?</h1>
          <p className="text-gray-600">
            Take a moment to reflect on your current mood and what might be influencing it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Scale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Mood Level
              </CardTitle>
              <CardDescription>
                Select the option that best represents how you're feeling right now.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoodScale
                value={moodLevel}
                onChange={setMoodLevel}
                size="lg"
                showLabels={true}
              />
            </CardContent>
          </Card>

          {/* Factors */}
          <Card>
            <CardHeader>
              <CardTitle>What factors are influencing your mood?</CardTitle>
              <CardDescription>
                Add any factors that might be contributing to how you're feeling. You can select from suggestions or add your own.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FactorSelector
                selectedFactors={factors}
                onChange={setFactors}
                maxFactors={5}
                placeholder="Search for factors or add your own..."
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes (Optional)</CardTitle>
              <CardDescription>
                Share any additional thoughts, context, or details about your mood.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was your day? Any specific events or thoughts you'd like to note?"
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting || moodLevel === 0}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Mood Entry
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Your mood data is private and secure. Regular tracking can help you understand patterns in your mental health.</p>
        </div>
      </div>
    </div>
  )
}