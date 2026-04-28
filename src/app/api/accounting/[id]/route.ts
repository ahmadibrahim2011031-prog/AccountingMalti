import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/utils/prisma'

// GET /api/accounting/[id] - Get a journal entry or account by id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'journal'

    if (type === 'account') {
      const account = await prisma.accountingAccount.findUnique({
        where: { id },
        include: {
          children: true,
          parent: { select: { id: true, name: true, accountNumber: true } },
          journalEntries: {
            include: {
              journal: { select: { id: true, journalNumber: true, date: true, description: true, status: true } }
            }
          }
        }
      })

      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: account })
    }

    const journalEntry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            account: {
              select: { id: true, accountNumber: true, name: true, nameAr: true, type: true, nature: true }
            }
          },
          orderBy: { lineNumber: 'asc' }
        }
      }
    })

    if (!journalEntry) {
      return NextResponse.json({ success: false, error: 'Journal entry not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: journalEntry })

  } catch (error: any) {
    console.error('❌ GET error:', error)
    return NextResponse.json({ success: false, error: `Failed to fetch: ${error.message}` }, { status: 500 })
  }
}

// PUT /api/accounting/[id] - Update a journal entry or account
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'journal'
    const updateData = await request.json()

    if (type === 'account') {
      const account = await prisma.accountingAccount.findUnique({ where: { id } })
      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
      }

      const updated = await prisma.accountingAccount.update({
        where: { id },
        data: {
          accountNumber: updateData.accountNumber ?? account.accountNumber,
          name: updateData.name ?? account.name,
          nameAr: updateData.nameAr ?? account.nameAr,
          category: updateData.category ?? account.category,
          expenseClassification: updateData.expenseClassification ?? account.expenseClassification,
          isPostable: updateData.isPostable ?? account.isPostable,
          isActive: updateData.isActive ?? account.isActive,
        }
      })

      return NextResponse.json({ success: true, data: updated, message: 'Account updated successfully' })
    }

    // Update journal entry
    const entry = await prisma.journalEntry.findUnique({ where: { id } })
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Journal entry not found' }, { status: 404 })
    }

    if (entry.status === 'POSTED') {
      return NextResponse.json({ success: false, error: 'Cannot edit a posted journal entry' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (updateData.details && Array.isArray(updateData.details)) {
        await tx.journalEntryDetail.deleteMany({ where: { journalId: id } })
        await tx.journalEntryDetail.createMany({
          data: updateData.details.map((d: any, i: number) => ({
            journalId: id,
            accountId: d.accountId,
            debit: d.debit || 0,
            credit: d.credit || 0,
            notes: d.notes || null,
            lineNumber: i + 1,
          }))
        })
      }

      return tx.journalEntry.update({
        where: { id },
        data: {
          date: updateData.date ? new Date(updateData.date) : entry.date,
          description: updateData.description ?? entry.description,
          totalAmount: updateData.totalAmount ?? entry.totalAmount,
          type: updateData.type ?? entry.type,
          status: updateData.status ?? entry.status,
          reference: updateData.reference ?? entry.reference,
        },
        include: {
          details: { include: { account: { select: { id: true, accountNumber: true, name: true } } } }
        }
      })
    })

    return NextResponse.json({ success: true, data: updated, message: 'Journal entry updated successfully' })

  } catch (error: any) {
    console.error('❌ PUT error:', error)
    return NextResponse.json({ success: false, error: `Failed to update: ${error.message}` }, { status: 500 })
  }
}

// DELETE /api/accounting/[id] - Delete a journal entry or account
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'journal'

    if (type === 'account') {
      const account = await prisma.accountingAccount.findUnique({
        where: { id },
        include: { journalEntries: true }
      })

      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
      }

      if (account.journalEntries.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete account with existing journal entries. Please remove or reassign entries first.'
        }, { status: 400 })
      }

      await prisma.accountingAccount.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Account deleted successfully' })
    }

    const entry = await prisma.journalEntry.findUnique({ where: { id } })
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Journal entry not found' }, { status: 404 })
    }

    if (entry.status === 'POSTED') {
      await prisma.journalEntry.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })
      return NextResponse.json({ success: true, message: 'Journal entry cancelled successfully' })
    }

    await prisma.journalEntry.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Journal entry deleted successfully' })

  } catch (error: any) {
    console.error('❌ DELETE error:', error)
    return NextResponse.json({ success: false, error: `Failed to delete: ${error.message}` }, { status: 500 })
  }
}
