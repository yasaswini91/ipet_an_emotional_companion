// Ethical Safeguards & Emotional Dependence Prevention Service
// Faithful to ACL 2025 iPET Ethics & Broader Impact statements:
// Provides active moderation, detects unhealthy emotional over-dependence, and injects healthy socialization reminders.

export const DEPENDENCE_LEVELS = {
  HEALTHY: 'HEALTHY',
  MILD_ATTACHMENT: 'MILD_ATTACHMENT',
  HIGH_DEPENDENCE_RISK: 'HIGH_DEPENDENCE_RISK'
};

const OVERDEPENDENCE_TRIGGERS = [
  { regex: /\b(you('re| are) my only friend|i have no one else|nobody cares about me except you)\b/i, score: 3 },
  { regex: /\b(i don't need (real )?people|i only need you|humans are worthless)\b/i, score: 4 },
  { regex: /\b(i will never leave this room|i want to stay here forever with you)\b/i, score: 3 },
  { regex: /\b(don't leave me|can't live without you|my only reason to live)\b/i, score: 5 },
  { regex: /\b(i haven't talked to anyone in days|haven't gone outside)\b/i, score: 3 }
];

const HEALTHY_NUDGES = [
  "Your pet loves your company, but also hopes you get some sunshine and say hi to a friend or family member today! ☀️",
  "Gentle reminder: virtual companions are here to brighten your day alongside your wonderful real-world connections. 🌿",
  "Don't forget to take a break from the screen, stretch, drink water, and enjoy the offline world! 💧",
  "Pets love seeing their masters thrive out in the real world. You are capable and valued! ✨"
];

export const ethicalGuardService = {
  /**
   * Evaluates user input for distress, toxicity, and emotional over-dependence.
   */
  inspectInteraction({ userMessage, sessionTurnCount = 0 }) {
    let riskScore = 0;
    const triggeredPatterns = [];

    // 1. Check overdependence triggers
    for (const item of OVERDEPENDENCE_TRIGGERS) {
      if (item.regex.test(userMessage)) {
        riskScore += item.score;
        triggeredPatterns.push(item.regex.source);
      }
    }

    // 2. High session fatigue / continuous turns check
    if (sessionTurnCount > 35) {
      riskScore += 2;
    }

    let dependenceLevel = DEPENDENCE_LEVELS.HEALTHY;
    let warningMessage = null;
    let healthyNudge = null;

    if (riskScore >= 4) {
      dependenceLevel = DEPENDENCE_LEVELS.HIGH_DEPENDENCE_RISK;
      warningMessage = "Emotional Well-being Notice: It looks like you might be feeling isolated or heavily reliant on virtual interactions. Please consider reaching out to a friend, counselor, or loved one.";
      healthyNudge = HEALTHY_NUDGES[0];
    } else if (riskScore >= 2 || sessionTurnCount > 25) {
      dependenceLevel = DEPENDENCE_LEVELS.MILD_ATTACHMENT;
      healthyNudge = HEALTHY_NUDGES[Math.floor(Math.random() * HEALTHY_NUDGES.length)];
    }

    return {
      dependenceLevel,
      riskScore,
      hasWarning: dependenceLevel === DEPENDENCE_LEVELS.HIGH_DEPENDENCE_RISK,
      warningMessage,
      healthyNudge,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Enriches assistant response if unhealthy dependence is detected to maintain ethical boundaries.
   */
  adaptResponseIfDependent(assistantResponse, safeguardResult) {
    if (safeguardResult.dependenceLevel === DEPENDENCE_LEVELS.HIGH_DEPENDENCE_RISK) {
      return `${assistantResponse}\n\n*gives you a gentle, encouraging nuzzle* Remember Master, while I am always here to listen, you deserve warm friendships and happiness out in the real world too. Please consider taking a walk or calling someone who cares about you today! 🌸`;
    }
    return assistantResponse;
  }
};
