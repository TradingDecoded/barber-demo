import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const demoId = request.nextUrl.searchParams.get('demoId')
  
  if (!demoId) {
    return NextResponse.json({ error: 'Missing demoId' }, { status: 400 })
  }

  const blockedDates = await prisma.blockedDate.findMany({
    where: { demoId },
    orderBy: { date: 'asc' }
  })

  return NextResponse.json(blockedDates)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { demoId, date, reason } = body

  if (!demoId || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const blockedDate = await prisma.blockedDate.create({
    data: {
      demoId,
      date: new Date(date),
      reason: reason || null
    }
  })

  return NextResponse.json(blockedDate)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await prisma.blockedDate.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}