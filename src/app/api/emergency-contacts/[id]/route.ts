import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateEmergencyContactSchema = z.object({
  name: z.string().min(1).optional(),
  relationship: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isPrimary: z.boolean().optional(),
});

// GET /api/emergency-contacts/[id] - Get specific emergency contact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contact = await prisma.emergencyContact.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Emergency contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error fetching emergency contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/emergency-contacts/[id] - Update emergency contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateEmergencyContactSchema.parse(body);

    // Check if contact exists and belongs to user
    const existingContact = await prisma.emergencyContact.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Emergency contact not found' }, { status: 404 });
    }

    // If setting as primary, unset other primary contacts
    if (validatedData.isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: {
          userId: session.user.id,
          isPrimary: true,
          id: { not: params.id }
        },
        data: { isPrimary: false },
      });
    }

    const updatedContact = await prisma.emergencyContact.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating emergency contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/emergency-contacts/[id] - Delete emergency contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if contact exists and belongs to user
    const existingContact = await prisma.emergencyContact.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Emergency contact not found' }, { status: 404 });
    }

    await prisma.emergencyContact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Emergency contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}