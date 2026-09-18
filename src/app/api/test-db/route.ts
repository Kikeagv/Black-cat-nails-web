import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function GET() {
  const servicios = db.servicios.list();
  return NextResponse.json(servicios);
}
