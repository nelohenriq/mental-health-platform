import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">MindWell</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/mood" className="text-gray-600 hover:text-blue-600">Mood Tracking</Link>
              <Link href="/cbt" className="text-gray-600 hover:text-blue-600">CBT Exercises</Link>
              <Link href="/conversations" className="text-gray-600 hover:text-blue-600">AI Chat</Link>
              <Link href="/profile" className="text-gray-600 hover:text-blue-600">Profile</Link>
            </nav>
            <div className="flex space-x-2">
              <Button variant="outline">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Mental Health Journey Starts Here
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your mood, practice CBT exercises, and engage in therapeutic conversations
            with AI support. Take control of your mental wellness with compassionate technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Your Journey
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comprehensive Mental Health Support
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Mood Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Monitor your emotional patterns with easy-to-use mood logging and trend analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Brain className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>CBT Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Practice evidence-based Cognitive Behavioral Therapy exercises tailored to your needs.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>AI Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Engage in supportive conversations with our AI therapist for guidance and reflection.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Personalized Care</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Receive personalized recommendations and progress tracking for your mental wellness journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Prioritize Your Mental Health?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have taken the first step towards better mental wellness.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Begin Your Journey Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">MindWell</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
              <Link href="/support" className="text-gray-400 hover:text-white">Support</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 MindWell. Your mental health matters.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
