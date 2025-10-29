# Microcopy Documentation - Mental Health Platform

## Overview

This document provides comprehensive microcopy, labels, and messaging for the mental health platform. All copy follows the established UX strategy principles: emotional safety first, accessibility-centered design, mobile-first optimization, and trust-building transparency.

## Voice & Tone Guidelines

### Primary Voice Principles
- **Empathetic & Supportive**: Acknowledge user challenges without judgment
- **Clear & Direct**: Use simple, accessible language (Flesch Reading Ease 70+)
- **Trust-Building**: Transparent about processes, privacy, and limitations
- **Action-Oriented**: Guide users toward helpful actions
- **Inclusive**: Respect diverse experiences and identities

### Tone Variations by Context
- **Supportive**: "We're here to help you through this"
- **Encouraging**: "You've taken an important step"
- **Reassuring**: "Your information is safe and secure"
- **Practical**: "Let's try a different approach"
- **Professional**: "Based on clinical guidelines"

### Accessibility Standards
- **Screen Reader Friendly**: Complete sentences, clear context
- **Concise**: Mobile-optimized (under 50 characters for buttons)
- **Semantic**: Meaningful labels that describe function, not just appearance
- **Consistent**: Standardized terms across the platform

## Navigation & Menu Copy

### Main Navigation (Mobile-First Hamburger Menu)
```json
{
  "nav": {
    "home": "Home",
    "mood": "Mood",
    "exercises": "Exercises",
    "conversations": "Conversations",
    "profile": "Profile",
    "settings": "Settings",
    "crisis": "Crisis Support"
  },
  "accessibility": {
    "nav_main": "Main navigation menu",
    "nav_toggle": "Toggle navigation menu",
    "nav_close": "Close navigation menu"
  }
}
```

### Breadcrumb Navigation
```json
{
  "breadcrumbs": {
    "home": "Home",
    "current_page": "Current: {page_name}",
    "separator": "Navigation separator"
  }
}
```

### Tab Navigation
```json
{
  "tabs": {
    "mood_log": "Log Mood",
    "mood_history": "History",
    "mood_insights": "Insights",
    "exercise_library": "Library",
    "exercise_progress": "My Progress",
    "conversation_active": "Active",
    "conversation_archive": "Archive"
  }
}
```

## Form Labels & Input Copy

### Authentication Forms
```json
{
  "login": {
    "email_label": "Email address",
    "email_placeholder": "Enter your email",
    "password_label": "Password",
    "password_placeholder": "Enter your password",
    "remember_me": "Keep me signed in",
    "forgot_password": "Forgot password?",
    "login_button": "Sign In",
    "signup_link": "Create account"
  },
  "registration": {
    "email_label": "Email address",
    "email_placeholder": "your.email@example.com",
    "password_label": "Create password",
    "password_placeholder": "At least 8 characters",
    "confirm_password_label": "Confirm password",
    "confirm_password_placeholder": "Re-enter your password",
    "terms_agreement": "I agree to the Terms of Service and Privacy Policy",
    "create_account_button": "Create Account",
    "login_link": "Already have an account?"
  },
  "accessibility": {
    "email_describedby": "We'll use this to create your secure account",
    "password_describedby": "Must be at least 8 characters with numbers and letters",
    "password_strength": "Password strength: {weak/medium/strong}"
  }
}
```

### Mood Tracking Form
```json
{
  "mood_scale": {
    "title": "How are you feeling right now?",
    "scale_labels": {
      "1": "Very difficult",
      "2": "Difficult",
      "3": "Okay",
      "4": "Good",
      "5": "Very good"
    },
    "accessibility": {
      "scale_describedby": "Rate your current emotional state on a scale from 1 to 5",
      "current_selection": "Currently selected: {rating}"
    }
  },
  "mood_factors": {
    "title": "What factors are influencing your mood? (Optional)",
    "factors": {
      "work": "Work stress",
      "relationships": "Relationships",
      "health": "Physical health",
      "sleep": "Sleep quality",
      "exercise": "Physical activity",
      "social": "Social connection",
      "weather": "Weather or environment",
      "other": "Other"
    },
    "accessibility": {
      "factors_describedby": "Select all factors that apply to help understand your mood patterns"
    }
  },
  "mood_notes": {
    "label": "Notes (Optional)",
    "placeholder": "Add any additional thoughts or context...",
    "accessibility": {
      "notes_describedby": "Share what's on your mind - this is private and secure"
    }
  },
  "save_button": "Save Mood Check",
  "cancel_button": "Cancel"
}
```

### Profile & Settings Forms
```json
{
  "profile": {
    "personal_info": {
      "title": "Personal Information",
      "first_name_label": "First name",
      "last_name_label": "Last name",
      "preferred_name_label": "Preferred name (optional)",
      "preferred_name_describedby": "How you'd like to be addressed in the app",
      "date_of_birth_label": "Date of birth",
      "timezone_label": "Timezone"
    },
    "preferences": {
      "title": "App Preferences",
      "notifications_label": "Push notifications",
      "notifications_describedby": "Receive gentle reminders for mood checks and exercises",
      "reminder_time_label": "Daily reminder time",
      "theme_label": "App theme",
      "theme_options": {
        "light": "Light",
        "dark": "Dark",
        "auto": "Auto (follows system)"
      }
    },
    "privacy": {
      "title": "Privacy & Sharing",
      "data_sharing_label": "Share anonymous data for research",
      "data_sharing_describedby": "Help improve mental health support for others",
      "therapist_sharing_label": "Share with healthcare provider",
      "emergency_contacts_label": "Emergency contacts"
    }
  },
  "accessibility": {
    "section_help": "Use arrow keys to navigate between sections",
    "save_progress": "Your changes are automatically saved"
  }
}
```

## Button Text & Call-to-Actions

### Primary Actions
```json
{
  "primary_buttons": {
    "get_started": "Get Started",
    "continue": "Continue",
    "save": "Save",
    "submit": "Submit",
    "complete": "Complete",
    "finish": "Finish",
    "done": "Done"
  },
  "secondary_buttons": {
    "cancel": "Cancel",
    "skip": "Skip for now",
    "back": "Go back",
    "edit": "Edit",
    "delete": "Delete",
    "archive": "Archive"
  },
  "tertiary_buttons": {
    "learn_more": "Learn more",
    "view_details": "View details",
    "see_all": "See all",
    "show_more": "Show more",
    "help": "Help"
  }
}
```

### Contextual Actions
```json
{
  "mood_actions": {
    "log_mood": "Log Mood",
    "view_history": "View History",
    "share_insights": "Share Insights"
  },
  "exercise_actions": {
    "start_exercise": "Start Exercise",
    "continue_exercise": "Continue",
    "mark_complete": "Mark Complete",
    "save_progress": "Save Progress"
  },
  "crisis_actions": {
    "get_help_now": "Get Help Now",
    "call_hotline": "Call Hotline",
    "emergency_contacts": "Emergency Contacts",
    "safety_plan": "Safety Plan"
  }
}
```

## Error Messages & Validation

### Form Validation (Empathetic & Actionable)
```json
{
  "validation_errors": {
    "required_field": "This information helps us support you better. Please fill in this field.",
    "email_invalid": "Please enter a valid email address so we can reach you securely.",
    "password_weak": "For your security, please use at least 8 characters with a mix of letters and numbers.",
    "password_mismatch": "The passwords don't match. Let's try again to keep your account secure.",
    "date_invalid": "Please enter a valid date in MM/DD/YYYY format.",
    "phone_invalid": "Please enter a valid phone number for emergency contacts."
  },
  "accessibility": {
    "error_prefix": "Error:",
    "error_list": "Please correct the following:",
    "field_error": "Field error for {field_name}: {error_message}"
  }
}
```

### System Errors (Reassuring & Helpful)
```json
{
  "system_errors": {
    "connection_lost": "Connection temporarily lost. Your data is safe - we'll reconnect automatically.",
    "save_failed": "We couldn't save right now. Your information is stored locally and will sync when connection returns.",
    "load_failed": "Having trouble loading. Please check your connection and try again.",
    "session_expired": "For your security, your session expired. Please sign in again.",
    "server_error": "We're experiencing technical difficulties. Our team has been notified and is working to fix this."
  },
  "recovery_actions": {
    "retry": "Try Again",
    "refresh": "Refresh Page",
    "contact_support": "Contact Support",
    "return_home": "Return Home"
  }
}
```

### Crisis-Specific Errors
```json
{
  "crisis_errors": {
    "emergency_unavailable": "Emergency services are temporarily unavailable. Please call 911 or your local emergency number directly.",
    "hotline_busy": "Hotlines are currently busy. Here are additional resources you can access right now.",
    "location_denied": "Location access denied. You can still access all crisis resources without sharing your location."
  }
}
```

## Success & Confirmation Messages

### Achievement Messages
```json
{
  "success_messages": {
    "mood_logged": "Mood check saved. Thank you for taking this moment for yourself.",
    "exercise_completed": "Great work completing this exercise! Every step forward counts.",
    "streak_achieved": "You've maintained a {number}-day streak! Your consistency is making a difference.",
    "milestone_reached": "Congratulations on reaching {milestone}! You're building important habits.",
    "profile_updated": "Your profile has been updated securely.",
    "data_exported": "Your data has been prepared for download. Check your email for the secure link."
  }
}
```

### Confirmation Dialogs
```json
{
  "confirmations": {
    "delete_mood_entry": "Are you sure you want to delete this mood entry? This action cannot be undone.",
    "delete_account": "We're sorry to see you go. Deleting your account will permanently remove all your data. This action cannot be undone.",
    "share_with_provider": "This will share your recent mood data with your healthcare provider. You can change this setting anytime.",
    "emergency_contact_add": "This person will be contacted only in emergency situations. Your privacy is protected.",
    "data_export": "Your data will be prepared as a secure, encrypted file. No one else will have access to it."
  },
  "confirmation_buttons": {
    "confirm": "Yes, continue",
    "cancel": "Cancel",
    "delete": "Yes, delete",
    "share": "Yes, share",
    "export": "Export data"
  }
}
```

## Accessibility Labels & Screen Reader Text

### ARIA Labels (Semantic & Descriptive)
```json
{
  "aria_labels": {
    "mood_scale": "Mood rating scale from 1 to 5, where 1 is very difficult and 5 is very good",
    "mood_factor_checkbox": "Mood factor: {factor_name}",
    "exercise_progress": "Exercise progress: {current_step} of {total_steps}",
    "notification_badge": "You have {count} unread notifications",
    "loading_spinner": "Loading content, please wait",
    "error_alert": "Error message: {error_text}",
    "success_message": "Success: {success_text}"
  },
  "live_regions": {
    "mood_saved": "Mood entry saved successfully",
    "exercise_started": "Exercise started",
    "error_occurred": "An error occurred: {error_message}",
    "loading_complete": "Content loaded successfully"
  }
}
```

### Focus Management
```json
{
  "focus_labels": {
    "skip_to_content": "Skip to main content",
    "skip_to_navigation": "Skip to navigation",
    "current_page": "Current page: {page_name}",
    "modal_opened": "Modal dialog opened: {modal_title}",
    "form_error": "Form error detected. Please review the errors below."
  }
}
```

## Crisis & Emergency Messaging

### Crisis Support Interface
```json
{
  "crisis_support": {
    "title": "You're not alone. Help is available right now.",
    "immediate_actions": {
      "call_emergency": "Call Emergency Services",
      "text_hotline": "Text Crisis Hotline",
      "find_help_nearby": "Find Help Nearby"
    },
    "breathing_exercise": "Take a slow, deep breath with me",
    "grounding_technique": "Let's try a simple grounding exercise",
    "professional_help": "Connect with a crisis counselor",
    "safety_plan": "Access your personal safety plan"
  },
  "emergency_contacts": {
    "title": "Emergency Contacts",
    "add_contact": "Add trusted contact",
    "contact_description": "These contacts will only be used in emergency situations",
    "call_emergency": "Call emergency contact",
    "message_emergency": "Send emergency message"
  },
  "accessibility": {
    "crisis_mode": "Crisis support mode activated. Simplified interface for immediate help.",
    "emergency_button": "Emergency action button: {action_name}",
    "hotline_status": "Crisis hotline status: {available/busy}"
  }
}
```

### Safety Planning
```json
{
  "safety_plan": {
    "title": "Your Safety Plan",
    "warning_signs": "Warning signs that crisis may be approaching",
    "coping_strategies": "Things that help when I'm struggling",
    "distraction_techniques": "Activities to distract from difficult thoughts",
    "support_network": "People I can reach out to for support",
    "professional_help": "Professional help and emergency contacts",
    "environmental_safety": "Making my environment safer"
  },
  "safety_messages": {
    "encouragement": "You've taken an important step by creating this plan. It's okay to use it when you need it.",
    "reminder": "Remember: this plan is for when things feel overwhelming. You're taking good care of yourself.",
    "update_prompt": "Consider updating your safety plan regularly as your needs change."
  }
}
```

## Onboarding & Welcome Copy

### Welcome Flow
```json
{
  "welcome": {
    "greeting": "Welcome to your mental health support companion",
    "introduction": "We're here to support you on your journey with gentle, accessible tools designed for real life.",
    "accessibility_first": "This app is designed to be accessible to everyone. You can customize settings anytime.",
    "privacy_assurance": "Your privacy and security are our top priorities. All data is encrypted and secure.",
    "getting_started": "Let's get you set up with a few quick steps"
  },
  "onboarding_steps": {
    "step_1": {
      "title": "Personalize your experience",
      "description": "Tell us a bit about yourself so we can provide the most relevant support"
    },
    "step_2": {
      "title": "Set your preferences",
      "description": "Choose how you'd like to receive reminders and customize your experience"
    },
    "step_3": {
      "title": "Connect support resources",
      "description": "Add emergency contacts and professional support for when you need it"
    },
    "step_4": {
      "title": "Take your first mood check",
      "description": "Start with a simple mood check to establish your baseline"
    }
  },
  "progress_indicators": {
    "step_progress": "Step {current} of {total}",
    "completion_message": "Almost there! Just a few more steps to get you started."
  }
}
```

### First-Time User Guidance
```json
{
  "first_use": {
    "mood_check_prompt": "Ready to log your first mood check? It only takes a moment.",
    "exercise_suggestion": "Based on your current mood, this gentle exercise might help",
    "feature_introduction": "Here's a quick overview of the main features",
    "help_available": "Need help? Tap the help button anytime or explore the settings."
  }
}
```

## Mood Tracking Interface Copy

### Mood Logging Flow
```json
{
  "mood_logging": {
    "initial_prompt": "How are you feeling right now?",
    "scale_instruction": "Tap the face that best matches your current emotional state",
    "factor_prompt": "What might be influencing this? (Optional - helps track patterns)",
    "notes_prompt": "Any thoughts you'd like to capture? (Completely private)",
    "save_confirmation": "Your mood check has been saved. Thank you for taking this time for yourself."
  },
  "mood_history": {
    "title": "Your Mood Journey",
    "date_range": "Showing moods from {start_date} to {end_date}",
    "no_data": "No mood entries yet. Start by logging your first mood check!",
    "insights_available": "View insights and patterns in your mood data",
    "export_data": "Download your mood history for your records"
  },
  "mood_insights": {
    "title": "Understanding Your Patterns",
    "trend_analysis": "Your mood trends over the past {time_period}",
    "factor_correlation": "Factors that often influence your mood",
    "improvement_areas": "Areas where you've shown improvement",
    "professional_recommendation": "Consider discussing these patterns with your healthcare provider"
  }
}
```

### Mood Scale Descriptions
```json
{
  "mood_descriptions": {
    "1": {
      "label": "Very Difficult",
      "description": "Feeling overwhelmed, hopeless, or in significant distress"
    },
    "2": {
      "label": "Difficult",
      "description": "Struggling with challenging emotions or circumstances"
    },
    "3": {
      "label": "Okay",
      "description": "Managing day-to-day, neither particularly good nor bad"
    },
    "4": {
      "label": "Good",
      "description": "Feeling positive, content, or optimistic"
    },
    "5": {
      "label": "Very Good",
      "description": "Feeling excellent, joyful, or at peace"
    }
  }
}
```

## CBT Exercise & Therapeutic Content Copy

### Exercise Library
```json
{
  "exercise_library": {
    "title": "Therapeutic Exercises",
    "categories": {
      "anxiety": "Anxiety & Worry",
      "depression": "Low Mood Support",
      "stress": "Stress Management",
      "sleep": "Sleep Support",
      "relationships": "Relationships",
      "self_care": "Self-Care",
      "mindfulness": "Mindfulness",
      "cbt": "CBT Techniques"
    },
    "difficulty_levels": {
      "beginner": "Beginner (5-10 minutes)",
      "intermediate": "Intermediate (10-20 minutes)",
      "advanced": "Advanced (20+ minutes)"
    },
    "exercise_card": {
      "duration": "{minutes} minutes",
      "difficulty": "Difficulty: {level}",
      "completed": "Completed {count} times",
      "start_button": "Start Exercise"
    }
  }
}
```

### Exercise Interface
```json
{
  "exercise_interface": {
    "progress_indicator": "Step {current} of {total}",
    "pause_button": "Pause Exercise",
    "resume_button": "Resume",
    "next_step": "Continue to next step",
    "previous_step": "Go back to previous step",
    "complete_exercise": "Complete Exercise",
    "reflection_prompt": "Take a moment to reflect on this exercise",
    "save_reflection": "Save your thoughts",
    "rate_exercise": "How helpful was this exercise?",
    "rating_options": {
      "1": "Not helpful",
      "2": "Somewhat helpful",
      "3": "Helpful",
      "4": "Very helpful",
      "5": "Extremely helpful"
    }
  },
  "exercise_feedback": {
    "completion_message": "Great work completing '{exercise_name}'! Every exercise helps build your coping skills.",
    "reflection_saved": "Your reflection has been saved privately.",
    "next_suggestion": "Based on this exercise, you might find '{suggested_exercise}' helpful next time."
  }
}
```

### CBT-Specific Content
```json
{
  "cbt_content": {
    "thought_record": {
      "title": "Thought Record",
      "description": "Identify and challenge unhelpful thinking patterns",
      "steps": {
        "situation": "Describe the situation",
        "emotions": "What emotions did you feel?",
        "thoughts": "What thoughts went through your mind?",
        "evidence_for": "Evidence that supports this thought",
        "evidence_against": "Evidence that challenges this thought",
        "balanced_view": "A more balanced perspective"
      }
    },
    "behavioral_activation": {
      "title": "Behavioral Activation",
      "description": "Build positive momentum through meaningful activities",
      "activity_prompt": "What small, enjoyable activity can you do today?",
      "mood_prediction": "Before doing it: How do you think you'll feel?",
      "mood_actual": "After doing it: How did you actually feel?"
    }
  }
}
```

## Data Privacy & Security Messaging

### Privacy Policy Summaries
```json
{
  "privacy_summary": {
    "data_collection": "We collect only the information needed to provide mental health support and improve our services.",
    "data_usage": "Your data is used solely to support your mental health journey and enhance the app experience.",
    "data_sharing": "We never sell your data. Limited sharing only occurs with your explicit consent or legal requirements.",
    "data_security": "All data is encrypted, stored securely, and accessible only to you and authorized providers.",
    "data_rights": "You have the right to access, correct, or delete your data at any time."
  },
  "security_indicators": {
    "encryption_badge": "End-to-end encryption",
    "hipaa_compliant": "HIPAA compliant",
    "gdpr_compliant": "GDPR compliant",
    "security_certified": "Security certified",
    "last_backup": "Last backed up: {date}"
  }
}
```

### Data Control Options
```json
{
  "data_controls": {
    "export_data": "Download all your data",
    "delete_data": "Delete specific data",
    "anonymize_data": "Remove personal identifiers",
    "pause_tracking": "Pause data collection temporarily",
    "data_retention": "Choose how long to keep your data",
    "third_party_sharing": "Control sharing with third parties"
  },
  "consent_management": {
    "analytics_consent": "Help improve the app with anonymous usage data",
    "research_consent": "Contribute to mental health research (fully anonymous)",
    "provider_sharing": "Share data with your healthcare provider",
    "emergency_access": "Allow emergency contacts to access crisis information"
  }
}
```

## Implementation Notes

### Content Management
- All copy should be externalized to translation files for localization
- Use semantic keys that describe function, not appearance
- Maintain consistency across platforms (web, mobile, etc.)
- Version control copy changes alongside feature updates

### Testing & Validation
- User testing for emotional impact and clarity
- Accessibility testing with screen readers
- Cultural sensitivity reviews
- Readability scoring (aim for grade 6-8 level)

### Maintenance Guidelines
- Regular review of copy effectiveness through user feedback
- Update copy when features change or new research emerges
- Monitor for inclusive language and cultural appropriateness
- Archive old copy versions for rollback if needed

This comprehensive microcopy documentation ensures consistent, empathetic, and accessible communication throughout the mental health platform, supporting users across all touchpoints and emotional states.