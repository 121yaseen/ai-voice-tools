# VoiceInsights

VoiceInsights is a real-time speech analysis tool that detects and counts filler words (like "um", "uh", "ah") as you speak. Built with Next.js and powered by Deepgram's Nova-3 AI model, it provides instant feedback to help improve your speaking clarity.

## Features

- **Real-time Detection**: Uses Deepgram's low-latency streaming API to catch filler words instantly.
- **Nova-3 Integration**: Leverages the latest state-of-the-art speech model for high accuracy.
- **Smart Counting**: Filters standard disfluencies while avoiding false positives (e.g., distinguishing "uh-huh" agreement from "uh" hesitation).
- **Audio Visualizer**: Real-time waveform visualization of your voice.
- **Dark/Light Mode**: Fully responsive UI with theme support.

## Getting Started

### Prerequisites

You need a Deepgram API Key. You can get one for free at [console.deepgram.com](https://console.deepgram.com/).

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/voice-tools.git
    cd voice-tools
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    pnpm install
    ```

3. Set up environment variables:
    Create a `.env.local` file in the root directory and add your Deepgram API key:

    ```bash
    DEEPGRAM_API_KEY=your_deepgram_api_key_here
    ```

4. Run the development server:

    ```bash
    npm run dev
    # or
    pnpm dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## How It Works

1. **Audio Capture**: The app captures microphone audio in the browser.
2. **Streaming**: Audio is streamed via WebSocket to Deepgram's API.
3. **Analysis**: Deepgram's `nova-3` model processes the stream with `filler_words=true`.
4. **Filtering**: The app receives transcripts and specifically counts tokens like "uh", "um", "hmm", "mhmm", etc., while handling punctuation to ensure accuracy (e.g., "uh-huh").

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Speech AI**: Deepgram SDK (Nova-3 Model)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Visualization**: HTML5 Canvas API
