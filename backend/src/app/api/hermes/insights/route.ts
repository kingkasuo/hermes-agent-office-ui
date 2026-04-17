// GET /api/hermes/insights - 获取 Hermes 使用洞察
import { NextResponse } from 'next/server';
import { getHermesInsights } from '@/lib/hermes-client';
import { memoryStore } from '@/lib/memory-store';

export async function GET() {
  try {
    // 尝试从内存获取缓存
    let insights = memoryStore.getInsights();

    // 如果没有缓存或缓存过期，从 hermes 获取
    if (!insights || Date.now() - insights.timestamp > 5 * 60 * 1000) {
      try {
        insights = await getHermesInsights();
        memoryStore.setInsights(insights);
      } catch (error) {
        console.warn('[API /hermes/insights] Failed to fetch fresh insights:', error);
        // 返回缓存或空数据
        insights = insights || {
          totalSessions: 0,
          totalMessages: 0,
          totalTokens: 0,
          usageByProvider: {},
          topSkills: [],
          period: '7d',
          timestamp: Date.now(),
        };
      }
    }

    return NextResponse.json({
      insights,
      cached: Date.now() - (insights?.timestamp || 0) < 5 * 60 * 1000,
    });
  } catch (error) {
    console.error('[API /hermes/insights] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Hermes insights' },
      { status: 500 }
    );
  }
}
