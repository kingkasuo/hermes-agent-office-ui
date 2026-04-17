// GET /api/health - Health check endpoint
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
}