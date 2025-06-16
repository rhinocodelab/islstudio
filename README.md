# ISL Studio

ISL Studio is a web application that generates Indian Sign Language (ISL) videos from text input, with features for video generation, publishing, and sharing.

## Features

- **Text to ISL Video Generation**: Convert text input into Indian Sign Language videos
- **Video Publishing**: Generate unique URLs for sharing ISL videos
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Modern UI**: Clean and intuitive user interface with accessibility features
- **Video Management**: Generate, preview, and delete videos as needed

## Tech Stack

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS
- **Video Processing**: FFmpeg
- **State Management**: React Hooks
- **API Routes**: Next.js API Routes

## Prerequisites

- Node.js (v16 or higher)
- FFmpeg installed on your system
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd islstudio
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:9002
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:9002`

## Project Structure

```
islstudio/
├── public/
│   ├── generated_videos/    # Generated ISL videos
│   ├── published_videos/    # Published video HTML files
│   └── image/              # Static images
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/          # API routes
│   │   └── page.tsx      # Main application page
│   └── components/       # React components
└── package.json
```

## API Endpoints

- `POST /api/generate-isl-video`: Generate ISL video from text
- `POST /api/publish-isl-video`: Publish ISL video and generate shareable URL
- `GET /api/serve-published-video`: Serve published video HTML files
- `DELETE /api/delete-generated-videos`: Delete generated videos

## Usage

1. **Generate ISL Video**:
   - Enter text in the input field
   - Click "Generate ISL Video"
   - Preview the generated video

2. **Publish Video**:
   - Click "Publish ISL Video"
   - Get a unique URL for sharing
   - Use the copy button to share the URL

3. **Manage Videos**:
   - Use "Delete All" to remove generated videos
   - Preview videos before publishing

## Development

- The project uses Next.js 13+ with the App Router
- API routes are implemented in the `src/app/api` directory
- Static files are served from the `public` directory
- Video processing is handled by FFmpeg

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license information here]

## Support

For support, please [add your support contact information]
