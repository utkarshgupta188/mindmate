# mindmate

## 🚀 Overview
MindMate is an AI-powered mental wellness companion designed to help users manage their mental health through various features such as stress tracking, mood analysis, and personalized chat responses. It leverages advanced technologies like sentiment analysis, machine learning, and real-time data processing to provide a comprehensive and engaging user experience.

## ✨ Features
- **AI-Powered Chat**: Engage in conversations with AI-driven chatbots that provide empathetic and contextual responses.
- **Mood and Stress Tracking**: Monitor your mood and stress levels over time with detailed analytics and visualizations.
- **Personalized Recommendations**: Receive tailored recommendations based on your mood and stress levels to help you stay motivated and balanced.
- **Real-time Progress Tracking**: Track your progress in real-time as you complete various activities and tasks.
- **Nature-Inspired Design**: Enjoy a calming and visually appealing interface with nature-themed elements and animations.

## 🛠️ Tech Stack
- **Programming Language**: TypeScript
- **Frameworks and Libraries**:
  - React
  - Next.js
  - Tailwind CSS
  - Framer Motion
  - Lucide React
  - Recharts
  - Three.js
  - Firebase
  - Express
  - PostgreSQL
  - Node.js
- **Tools**:
  - Vite
  - Vercel
  - GitHub Actions

## 📦 Installation

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/utkarshgupta188/mindmate.git

# Navigate to the project directory
cd mindmate

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Alternative Installation Methods
- **Docker**: Use the provided Dockerfile to containerize the application.
- **Vercel**: Deploy the application using Vercel's CLI or dashboard.

## 🎯 Usage

### Basic Usage
```typescript
// Example of using the chatbot
const chatbot = new Chatbot();
chatbot.startConversation('Hello, how are you feeling today?');
```

### Advanced Usage
- **Customizing Chatbot Responses**: Modify the sentiment analysis and response generation logic to suit your needs.
- **Integrating with External APIs**: Use the provided API endpoints to integrate with other services and data sources.
- **Customizing the Interface**: Tailor the design and layout of the application using Tailwind CSS and other styling tools.

## 📁 Project Structure
```
mindmate/
├── backend/
│   ├── index.js
│   ├── .env.example
│   ├── newsRouter.js
│   ├── sentimentRouter.js
│   ├── authRouter.js
│   ├── emailRouter.js
│   ├── database.js
│   └── firebaseAdmin.js
├── src/
│   ├── components/
│   │   ├── AssistantEmbed.tsx
│   │   ├── BotLauncher.tsx
│   │   ├── BreathingGame.tsx
│   │   ├── BreathingWidget.tsx
│   │   ├── CameraEmotion.tsx
│   │   ├── ChartCard.tsx
│   │   ├── CrisisModal.tsx
│   │   ├── DarkModeToggle.tsx
│   │   ├── FocusTimer.tsx
│   │   ├── JournalQuick.tsx
│   │   ├── MemoryGame.tsx
│   │   ├── ReactionGame.tsx
│   │   ├── LiveTrendChart.tsx
│   │   ├── MoodTable.tsx
│   │   ├── NatureScene.tsx
│   │   ├── Navbar.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── ProfileImageUploader.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ScrollToTop.tsx
│   │   ├── TaskList.tsx
│   │   ├── VoiceControls.tsx
│   │   └── YoloDetect.tsx
│   ├── config/
│   │   ├── appConfig.ts
│   │   └── firebase.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   └── useLiveTrend.ts
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Motivations.tsx
│   │   ├── News.tsx
│   │   ├── IndiaHelp.tsx
│   │   ├── Games.tsx
│   │   ├── Chat.tsx
│   │   ├── Reports.tsx
│   │   ├── Profile.tsx
│   │   └── EditProfile.tsx
│   ├── utils/
│   │   ├── emotionMap.ts
│   │   ├── onboarding.ts
│   │   ├── sentiment.ts
│   │   └── sentimentApi.ts
│   ├── App.tsx
│   └── index.tsx
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

## 🔧 Configuration
- **Environment Variables**: Create a `.env.local` file in the project root to configure client settings.
  ```env
  VITE_API_BASE=/api
  VITE_GEMINI_MODEL=gemini-2.5-flash
  VITE_ASSISTANT_URL=http://localhost:8001/
  VITE_YOLO_API=http://localhost:8002/yolo/detect
  ```

- **Database Configuration**: Set up your PostgreSQL database and configure the `NEON_DATABASE_URL` environment variable.
  ```env
  NEON_DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
  ```

## 🤝 Contributing
We welcome contributions! Here's how you can get started:

### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/utkarshgupta188/mindmate.git
   cd mindmate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Code Style Guidelines
- Follow the existing code style and formatting conventions.
- Use TypeScript for all new code.

### Pull Request Process
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear and concise messages.
4. Push your branch to your fork.
5. Open a pull request and describe your changes.

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👥 Authors & Contributors
- **Maintainers**:
  - [Utkarsh Gupta](https://github.com/utkarshgupta188)
- **Contributors**:
  - [Ishaan Sen](https://github.com/ishaanyk)

## 🐛 Issues & Support
- **Reporting Issues**: Please open an issue on the GitHub repository.
- **Getting Help**: Join the discussion on the project's GitHub Discussions tab.
- **FAQ**: Check the [FAQ](FAQ.md) for common questions and answers.

## 🗺️ Roadmap
- **Planned Features**:
  - Integration with more mental health resources.
  - Enhanced chatbot capabilities.
  - Improved real-time data processing.
- **Future Improvements**:
  - Better integration with external APIs.
  - Enhanced user interface and experience.
  - More advanced analytics and reporting.

---

**Additional Guidelines:**
- Use modern markdown features (badges, collapsible sections, etc.)
- Include practical, working code examples
- Make it visually appealing with appropriate emojis
- Ensure all code snippets are syntactically correct for TypeScript
- Include relevant badges (build status, version, license, etc.)
- Make installation instructions copy-pasteable
- Focus on clarity and developer experience