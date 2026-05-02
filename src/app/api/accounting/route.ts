import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

// Helper function to convert Decimal fields to numbers and Dates to ISO strings
function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsToNumbers(item))
  }

  // Convert Date objects to ISO strings
  if (obj instanceof Date) {
    return obj.toISOString()
  }

  if (typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      const value = obj[key]
      // Convert Decimal fields
      if (key === 'balance' || key === 'debit' || key === 'credit' || key === 'totalAmount') {
        converted[key] = Number(value)
      }
      // Convert Date fields to ISO strings
      else if (value instanceof Date) {
        converted[key] = value.toISOString()
      }
      else if (typeof value === 'object' && value !== null) {
        converted[key] = convertDecimalsToNumbers(value)
      } else {
        converted[key] = value
      }
    }
    return converted
  }

  return obj
}

// Helper function for document uploads
async function handleDocumentUpload(file: File, journalNumber: string): Promise<string> {
  try {
    const extension = path.extname(file.name)
    const timestamp = Date.now()
    const filename = `document-${timestamp}${extension}`
    
    // Create upload directory using journal number
    const uploadsBase = process.env.UPLOADS_PATH || path.join(process.cwd(), 'public', 'uploads')
    const uploadDir = path.join(uploadsBase, 'accounting', journalNumber)
    await mkdir(uploadDir, { recursive: true })
    
    // Save file
    const filepath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))
    
    // Return API URL for file serving
    return `/api/uploads/accounting/${journalNumber}/${filename}`
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error('Failed to upload document')
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const accountId = searchParams.get('accountId')
    const reportType = searchParams.get('reportType')

    switch (type) {
      case 'balance-sheet': {
        // Fetch ASSET, LIABILITY, EQUITY accounts
        const accounts = await prisma.accountingAccount.findMany({
          where: { type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }, isActive: true },
          include: { journalEntries: { select: { debit: true, credit: true } } },
          orderBy: [{ accountNumber: 'asc' }]
        })

        // Calculate balance from journal entries only
        const accountsWithCalculatedBalance = accounts.map(account => {
          const totalDebit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.debit), 0)
          const totalCredit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.credit), 0)

          let calculatedBalance = 0
          if (account.type === 'ASSET') {
            calculatedBalance = totalDebit - totalCredit
          } else if (account.type === 'LIABILITY' || account.type === 'EQUITY') {
            calculatedBalance = totalCredit - totalDebit
          }

          const { journalEntries, ...accountData } = account
          return { ...accountData, balance: calculatedBalance }
        })

        return NextResponse.json({ accounts: accountsWithCalculatedBalance })
      }

      case 'income-statement': {
        // Fetch revenue and expense accounts with balances for date range
        const accounts = await prisma.accountingAccount.findMany({
          where: {
            type: {
              in: ['REVENUE', 'EXPENSE']
            },
            isActive: true
          },
          include: {
            journalEntries: {
              where: {
                journal: {
                  date: {
                    gte: dateFrom ? new Date(dateFrom) : undefined,
                    lte: dateTo ? new Date(dateTo) : undefined
                  }
                }
              },
              include: {
                journal: true
              }
            }
          },
          orderBy: [
            { type: 'asc' },
            { accountNumber: 'asc' }
          ]
        })

        // Calculate balances for each account based on entries
        const accountsWithBalances = accounts.map(account => {
          // Calculate sum of debits and credits
          const totalDebit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.debit), 0)
          const totalCredit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.credit), 0)

          let balance = 0
          if (account.type === 'REVENUE') {
            // Revenue: Credit increases, Debit decreases
            balance = totalCredit - totalDebit
          } else if (account.type === 'EXPENSE') {
            // Expenses: Debit increases, Credit decreases
            balance = totalDebit - totalCredit
          }

          return {
            ...account,
            balance
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ accounts: accountsWithBalances }))
      }

      case 'journal-entries': {
        // Fetch all journal entries with filtering
        const entries = await prisma.journalEntry.findMany({
          where: {
            date: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined
            }
          },
          include: {
            details: {
              include: {
                account: {
                  select: {
                    id: true,
                    accountNumber: true,
                    name: true,
                    nameAr: true,
                    type: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ entries }))
      }

      case 'asset-accounts': {
        // Fetch all asset accounts for selection in transaction form
        const accounts = await prisma.accountingAccount.findMany({
          where: {
            type: 'ASSET',
            isActive: true,
            isPostable: true
          },
          select: {
            id: true,
            accountNumber: true,
            name: true,
            nameAr: true,
            balance: true
          },
          orderBy: {
            accountNumber: 'asc'
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ accounts }))
      }

      case 'all-accounts': {
        // Fetch all accounts for general ledger selection with journal entries
        const accounts = await prisma.accountingAccount.findMany({
          where: {
            isActive: true,
            isPostable: true
          },
          select: {
            id: true,
            accountNumber: true,
            name: true,
            nameAr: true,
            type: true,
            nature: true,
            balance: true,
            journalEntries: {
              select: {
                debit: true,
                credit: true
              }
            }
          },
          orderBy: [
            { accountNumber: 'asc' }
          ]
        })

        // Calculate balance from initial balance + journal entries
        const accountsWithCalculatedBalance = accounts.map(account => {
          const totalDebit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.debit), 0)
          const totalCredit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.credit), 0)

          let calculatedBalance = 0
          if (account.nature === 'DEBIT') {
            calculatedBalance = totalDebit - totalCredit
          } else if (account.nature === 'CREDIT') {
            calculatedBalance = totalCredit - totalDebit
          }

          const { journalEntries, ...accountData } = account
          return {
            ...accountData,
            balance: calculatedBalance
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ accounts: accountsWithCalculatedBalance }))
      }

      case 'ledger': {
        if (!accountId) {
          return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
        }

        // Get account details
        const account = await prisma.accountingAccount.findUnique({
          where: { id: accountId }
        })

        if (!account) {
          return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        // Get journal entries for this account
        const entries = await prisma.journalEntryDetail.findMany({
          where: {
            accountId,
            journal: {
              date: {
                gte: dateFrom ? new Date(dateFrom) : undefined,
                lte: dateTo ? new Date(dateTo) : undefined
              }
            }
          },
          include: {
            journal: {
              select: {
                id: true,
                date: true,
                reference: true,
                description: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            journal: {
              date: 'asc'
            }
          }
        })

        // Transform entries to flat structure
        const transformedEntries = entries.map(entry => ({
          id: entry.id,
          date: entry.journal.date,
          reference: entry.journal.reference,
          description: entry.journal.description,
          debit: Number(entry.debit),
          credit: Number(entry.credit),
          createdAt: entry.journal.createdAt
        }))

        // Calculate opening balance (initial balance + all entries before dateFrom)
        // Opening balance = sum of all journal entries before dateFrom (entries only, no initial balance field)
        let openingBalance = 0
        if (dateFrom) {
          const priorEntries = await prisma.journalEntryDetail.findMany({
            where: {
              accountId,
              journal: { date: { lt: new Date(dateFrom) } }
            }
          })

          const priorMovement = priorEntries.reduce((sum, entry) => {
            return sum + Number(entry.debit) - Number(entry.credit)
          }, 0)

          if (account.nature === 'DEBIT') {
            openingBalance = priorMovement
          } else {
            openingBalance = -priorMovement
          }
        }

        return NextResponse.json({
          entries: transformedEntries,
          openingBalance,
          account
        })
      }

      case 'report': {
        if (!reportType) {
          return NextResponse.json({ error: 'Report type required' }, { status: 400 })
        }

        switch (reportType) {
          case 'balance-sheet': {
            // Fetch accounts with their journal entries
            const accounts = await prisma.accountingAccount.findMany({
              where: {
                type: {
                  in: ['ASSET', 'LIABILITY', 'EQUITY']
                },
                isActive: true,
                isPostable: true
              },
              include: {
                journalEntries: {
                  select: {
                    debit: true,
                    credit: true
                  }
                }
              }
            })

            // Calculate balances from journal entries only
            let assets = 0
            let liabilities = 0
            let equity = 0

            accounts.forEach(account => {
              const totalDebit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.debit), 0)
              const totalCredit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.credit), 0)

              if (account.type === 'ASSET') {
                assets += (totalDebit - totalCredit)
              } else if (account.type === 'LIABILITY') {
                liabilities += (totalCredit - totalDebit)
              } else if (account.type === 'EQUITY') {
                equity += (totalCredit - totalDebit)
              }
            })

            return NextResponse.json({
              balanceSheet: {
                assets,
                liabilities,
                equity
              }
            })
          }

          case 'income-statement': {
            const accounts = await prisma.accountingAccount.findMany({
              where: {
                type: {
                  in: ['REVENUE', 'EXPENSE']
                },
                isActive: true
              },
              include: {
                journalEntries: {
                  where: {
                    journal: {
                      date: {
                        gte: dateFrom ? new Date(dateFrom) : undefined,
                        lte: dateTo ? new Date(dateTo) : undefined
                      }
                    }
                  }
                }
              }
            })

            let totalRevenue = 0
            let totalExpenses = 0

            accounts.forEach(account => {
              // Calculate sum of debits and credits
              const totalDebit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.debit), 0)
              const totalCredit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.credit), 0)

              if (account.type === 'REVENUE') {
                // Revenue: Credit increases, Debit decreases
                totalRevenue += (totalCredit - totalDebit)
              } else if (account.type === 'EXPENSE') {
                // Expenses: Debit increases, Credit decreases
                totalExpenses += (totalDebit - totalCredit)
              }
            })

            return NextResponse.json({
              incomeStatement: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                netProfit: totalRevenue - totalExpenses
              }
            })
          }

          case 'trial-balance': {
            // Fetch accounts with their journal entries
            const accounts = await prisma.accountingAccount.findMany({
              where: {
                isActive: true,
                isPostable: true
              },
              select: {
                accountNumber: true,
                name: true,
                nameAr: true,
                nature: true,
                journalEntries: {
                  select: {
                    debit: true,
                    credit: true
                  }
                }
              },
              orderBy: {
                accountNumber: 'asc'
              }
            })

            let totalDebit = 0
            let totalCredit = 0

            const accountsData = accounts.map(account => {
              const movement = account.journalEntries.reduce((sum, entry) => {
                return sum + Number(entry.debit) - Number(entry.credit)
              }, 0)

              // DEBIT nature: balance = debit - credit (positive = debit column)
              // CREDIT nature: balance = credit - debit (positive = credit column)
              let balance = 0
              if (account.nature === 'DEBIT') {
                balance = movement
              } else {
                balance = -movement
              }

              let debit = 0
              let credit = 0

              if (account.nature === 'DEBIT') {
                if (balance >= 0) {
                  debit = balance
                } else {
                  credit = Math.abs(balance)
                }
              } else { // CREDIT nature
                if (balance >= 0) {
                  credit = balance
                } else {
                  debit = Math.abs(balance)
                }
              }

              totalDebit += debit
              totalCredit += credit

              return {
                accountNumber: account.accountNumber,
                name: account.name,
                debit,
                credit
              }
            })

            return NextResponse.json({
              trialBalance: {
                accounts: accountsData,
                totalDebit,
                totalCredit
              }
            })
          }

          case 'cash-flow': {
            // Simplified cash flow - would need more complex logic for real implementation
            const cashAccounts = await prisma.accountingAccount.findMany({
              where: {
                OR: [
                  { category: { contains: 'cash' } },
                  { category: { contains: 'نقد' } },
                  { name: { contains: 'cash' } },
                  { name: { contains: 'نقد' } }
                ],
                isActive: true
              },
              include: {
                journalEntries: {
                  where: {
                    journal: {
                      date: {
                        gte: dateFrom ? new Date(dateFrom) : undefined,
                        lte: dateTo ? new Date(dateTo) : undefined
                      }
                    }
                  },
                  include: {
                    journal: {
                      select: {
                        description: true
                      }
                    }
                  }
                }
              }
            })

            let operating = 0
            let investing = 0
            let financing = 0

            cashAccounts.forEach(account => {
              account.journalEntries.forEach(entry => {
                const amount = Number(entry.debit) - Number(entry.credit)
                const desc = entry.journal.description.toLowerCase()

                if (desc.includes('operating') || desc.includes('تشغيل')) {
                  operating += amount
                } else if (desc.includes('investing') || desc.includes('استثمار')) {
                  investing += amount
                } else if (desc.includes('financing') || desc.includes('تمويل')) {
                  financing += amount
                } else {
                  operating += amount // Default to operating
                }
              })
            })

            return NextResponse.json({
              cashFlow: {
                operating,
                investing,
                financing,
                netCashFlow: operating + investing + financing
              }
            })
          }

          case 'analysis': {
            const accounts = await prisma.accountingAccount.findMany({
              where: {
                type: {
                  in: ['REVENUE', 'EXPENSE']
                },
                isActive: true
              },
              include: {
                journalEntries: {
                  where: {
                    journal: {
                      date: {
                        gte: dateFrom ? new Date(dateFrom) : undefined,
                        lte: dateTo ? new Date(dateTo) : undefined
                      }
                    }
                  }
                }
              }
            })

            const expenseData: { [key: string]: number } = {}
            const revenueData: { [key: string]: number } = {}
            let totalExpenses = 0
            let totalRevenue = 0

            accounts.forEach(account => {
              const balance = Math.abs(
                account.journalEntries.reduce((sum, entry) => {
                  return sum + Number(entry.debit) - Number(entry.credit)
                }, 0)
              )

              if (account.type === 'EXPENSE') {
                const category = account.category || account.name
                expenseData[category] = (expenseData[category] || 0) + balance
                totalExpenses += balance
              } else if (account.type === 'REVENUE') {
                const category = account.category || account.name
                revenueData[category] = (revenueData[category] || 0) + balance
                totalRevenue += balance
              }
            })

            const topExpenses = Object.entries(expenseData)
              .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
              }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)

            const topRevenue = Object.entries(revenueData)
              .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
              }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)

            return NextResponse.json({
              analysis: {
                topExpenses,
                topRevenue
              }
            })
          }

          default:
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
        }
      }

      case 'expenses-by-classification': {
        const classification = searchParams.get('classification') as 'OPERATIONAL' | 'ADMINISTRATIVE' | 'MARKETING' | null

        const expenses = await prisma.accountingAccount.findMany({
          where: {
            type: 'EXPENSE',
            isActive: true,
            ...(classification && { expenseClassification: classification })
          },
          include: {
            journalEntries: {
              include: {
                journal: true
              },
              where: dateFrom && dateTo ? {
                journal: {
                  date: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo)
                  }
                }
              } : undefined
            }
          },
          orderBy: {
            accountNumber: 'asc'
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ accounts: expenses }))
      }

      case 'expense-classification-stats': {
        const stats = await prisma.accountingAccount.groupBy({
          by: ['expenseClassification'],
          where: {
            type: 'EXPENSE',
            isActive: true,
            expenseClassification: { not: null }
          },
          _sum: {
            balance: true
          },
          _count: {
            id: true
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ stats }))
      }

      case 'debug-account': {
        // Debug endpoint to check what's in the database for a specific account
        if (!accountId) {
          return NextResponse.json({ error: 'accountId parameter required' }, { status: 400 })
        }

        const account = await prisma.accountingAccount.findUnique({
          where: { id: accountId },
          include: {
            journalEntries: {
              include: {
                journal: {
                  select: {
                    id: true,
                    journalNumber: true,
                    date: true,
                    description: true
                  }
                }
              },
              orderBy: {
                journal: {
                  date: 'desc'
                }
              }
            }
          }
        })

        if (!account) {
          return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        // Calculate balance from journal entries only
        const totalDebit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.debit), 0)
        const totalCredit = account.journalEntries.reduce((sum, entry) => sum + Number(entry.credit), 0)

        let calculatedBalance = 0
        if (account.nature === 'DEBIT') {
          calculatedBalance = totalDebit - totalCredit
        } else if (account.nature === 'CREDIT') {
          calculatedBalance = totalCredit - totalDebit
        }

        return NextResponse.json(convertDecimalsToNumbers({
          account: {
            id: account.id,
            accountNumber: account.accountNumber,
            name: account.name,
            nameAr: account.nameAr,
            type: account.type,
            nature: account.nature,
            storedBalance: account.balance
          },
          calculation: {
            totalDebit,
            totalCredit,
            calculatedBalance,
            formula: account.nature === 'DEBIT' ? 'debit - credit' : 'credit - debit'
          },
          journalEntries: account.journalEntries.map(entry => ({
            journalId: entry.journal.id,
            journalNumber: entry.journal.journalNumber,
            date: entry.journal.date,
            description: entry.journal.description,
            debit: Number(entry.debit),
            credit: Number(entry.credit)
          }))
        }))
      }

      case 'all-journal-entries': {
        // Debug endpoint to see all journal entries in the system
        const journals = await prisma.journalEntry.findMany({
          include: {
            details: {
              include: {
                account: {
                  select: {
                    id: true,
                    accountNumber: true,
                    name: true,
                    nameAr: true,
                    type: true,
                    nature: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({
          totalEntries: journals.length,
          entries: journals.map(journal => ({
            id: journal.id,
            journalNumber: journal.journalNumber,
            date: journal.date,
            description: journal.description,
            details: journal.details.map(detail => ({
              accountNumber: detail.account.accountNumber,
              accountName: detail.account.name,
              accountNameAr: detail.account.nameAr,
              accountType: detail.account.type,
              accountNature: detail.account.nature,
              debit: Number(detail.debit),
              credit: Number(detail.credit)
            })),
            totalDebit: journal.details.reduce((sum, d) => sum + Number(d.debit), 0),
            totalCredit: journal.details.reduce((sum, d) => sum + Number(d.credit), 0),
            isBalanced: Math.abs(
              journal.details.reduce((sum, d) => sum + Number(d.debit), 0) -
              journal.details.reduce((sum, d) => sum + Number(d.credit), 0)
            ) < 0.01
          }))
        }))
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in accounting GET:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if action is in query params (for FormData requests like uploadDocument)
    const { searchParams } = new URL(request.url)
    const queryAction = searchParams.get('action')
    
    let action: string
    let data: any
    let body: any = null
    
    if (queryAction) {
      // Action from query params (FormData requests)
      action = queryAction
      data = null  // Will be handled in the specific case
    } else {
      // Action from JSON body (regular requests)
      body = await request.json()
      action = body.action
      data = body.data
    }
    switch (action) {
      case 'createAccount': {
        const account = await prisma.accountingAccount.create({
          data: {
            accountNumber: data.accountNumber,
            name: data.name,
            nameAr: data.nameAr,
            type: data.type,
            category: data.category,
            parentId: data.parentId || null,
            level: data.parentId ? 1 : 0, // Simplified - would calculate based on parent
            isPostable: data.isPostable,
            balance: data.balance || 0,
            nature: data.type === 'ASSET' || data.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT',
            isActive: true,
            expenseClassification: data.expenseClassification || null
          }
        })

        return NextResponse.json({ account })
      }

      case 'updateAccount': {
        const updateId = body.accountId || data?.id
        if (!updateId) {
          return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
        }

        const account = await prisma.accountingAccount.update({
          where: { id: updateId },
          data: {
            name: data.name,
            nameAr: data.nameAr,
            accountNumber: data.accountNumber,
            category: data.category,
            balance: data.balance,
            isActive: data.isActive,
            expenseClassification: data.expenseClassification !== undefined ? data.expenseClassification : undefined
          }
        })

        return NextResponse.json({ account })
      }

      case 'updateBalance': {
        const accountId = body.accountId || data?.id
        const balance = body.balance !== undefined ? body.balance : data?.balance

        if (!accountId) {
          return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
        }

        const account = await prisma.accountingAccount.update({
          where: { id: accountId },
          data: { balance }
        })

        return NextResponse.json({ account })
      }

      case 'deleteAccount': {
        const accountId = body.accountId || data?.id

        if (!accountId) {
          return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
        }

        // Check if account has children
        const children = await prisma.accountingAccount.count({
          where: { parentId: accountId }
        })

        if (children > 0) {
          return NextResponse.json(
            { error: 'Cannot delete account with child accounts' },
            { status: 400 }
          )
        }

        // Check if account has entries
        const entries = await prisma.journalEntryDetail.count({
          where: { accountId }
        })

        if (entries > 0) {
          return NextResponse.json(
            { error: 'Cannot delete account with journal entries' },
            { status: 400 }
          )
        }

        await prisma.accountingAccount.delete({
          where: { id: accountId }
        })

        return NextResponse.json({ success: true })
      }

      case 'clearAllAccountingData': {
        // This will delete all journal entries and reset all account balances to 0
        // But keeps the Chart of Accounts structure intact

        // Delete all journal entry details first (due to foreign key constraints)
        const deletedDetails = await prisma.journalEntryDetail.deleteMany({})

        // Delete all journal entries
        const deletedEntries = await prisma.journalEntry.deleteMany({})

        // Reset all account balances to 0
        const updatedAccounts = await prisma.accountingAccount.updateMany({
          data: {
            balance: 0
          }
        })

        return NextResponse.json({
          success: true,
          message: 'All accounting data cleared successfully',
          details: {
            journalEntriesDeleted: deletedEntries.count,
            journalDetailsDeleted: deletedDetails.count,
            accountsReset: updatedAccounts.count
          }
        })
      }

      case 'createTransaction': {
        // Create income/expense transaction with proper double-entry
        // For EXPENSE: Debit Expense, Credit Asset (e.g., Debit Salaries, Credit Bank)
        // For REVENUE: Debit Asset, Credit Revenue (e.g., Debit Bank, Credit Sales)

        const { date, transactionType, categoryId, categoryName, amount, assetAccountId, description } = data

        if (!transactionType || !amount || !assetAccountId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get or create category account
        let categoryAccount = null
        if (categoryId) {
          categoryAccount = await prisma.accountingAccount.findUnique({
            where: { id: categoryId }
          })
        } else if (categoryName) {
          // Find by name or create new
          categoryAccount = await prisma.accountingAccount.findFirst({
            where: {
              OR: [
                { name: categoryName },
                { nameAr: categoryName }
              ],
              type: transactionType as any
            }
          })

          if (!categoryAccount) {
            // Create new category account
            const accountCount = await prisma.accountingAccount.count({
              where: { type: transactionType as any }
            })
            const accountNumber = transactionType === 'EXPENSE' ? `5${String(accountCount + 1).padStart(3, '0')}` : `4${String(accountCount + 1).padStart(3, '0')}`

            categoryAccount = await prisma.accountingAccount.create({
              data: {
                accountNumber,
                name: categoryName,
                nameAr: categoryName,
                type: transactionType as any,
                level: 0,
                isPostable: true,
                balance: 0,
                nature: transactionType === 'EXPENSE' ? 'DEBIT' : 'CREDIT',
                isActive: true
              }
            })
          }
        }

        if (!categoryAccount) {
          return NextResponse.json({ error: 'Category account not found or created' }, { status: 400 })
        }

        // Generate unique journal number based on timestamp and random number
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 1000)
        const journalNumber = `JE-${timestamp}-${String(random).padStart(3, '0')}`

        // Create journal entry with two lines
        const journalEntry = await prisma.$transaction(async (tx) => {
          const entry = await tx.journalEntry.create({
            data: {
              journalNumber,
              date: new Date(date),
              description: description || `${transactionType === 'EXPENSE' ? 'Expense' : 'Revenue'}: ${categoryAccount.name}`,
              totalAmount: amount,
              type: 'DAILY',
              status: 'POSTED',
              details: {
                create: transactionType === 'EXPENSE'
                  ? [
                      // Line 1: Debit Expense Account
                      {
                        accountId: categoryAccount.id,
                        debit: amount,
                        credit: 0,
                        lineNumber: 1,
                        notes: description
                      },
                      // Line 2: Credit Asset Account
                      {
                        accountId: assetAccountId,
                        debit: 0,
                        credit: amount,
                        lineNumber: 2,
                        notes: description
                      }
                    ]
                  : [
                      // Line 1: Debit Asset Account
                      {
                        accountId: assetAccountId,
                        debit: amount,
                        credit: 0,
                        lineNumber: 1,
                        notes: description
                      },
                      // Line 2: Credit Revenue Account
                      {
                        accountId: categoryAccount.id,
                        debit: 0,
                        credit: amount,
                        lineNumber: 2,
                        notes: description
                      }
                    ]
              }
            },
            include: {
              details: {
                include: {
                  account: true
                }
              }
            }
          })

          // Update account balances
          // Update category account
          const categoryNewBalance = transactionType === 'EXPENSE'
            ? Number(categoryAccount.balance) + amount  // Expense increases with debit
            : Number(categoryAccount.balance) + amount  // Revenue increases with credit (but we store absolute value)

          await tx.accountingAccount.update({
            where: { id: categoryAccount.id },
            data: { balance: categoryNewBalance }
          })

          // Update asset account
          const assetAccount = await tx.accountingAccount.findUnique({
            where: { id: assetAccountId }
          })

          if (assetAccount) {
            const assetNewBalance = transactionType === 'EXPENSE'
              ? Number(assetAccount.balance) - amount  // Asset decreases with credit
              : Number(assetAccount.balance) + amount  // Asset increases with debit

            await tx.accountingAccount.update({
              where: { id: assetAccountId },
              data: { balance: assetNewBalance }
            })
          }

          return entry
        })

        return NextResponse.json(convertDecimalsToNumbers({ journalEntry }))
      }

      case 'createJournalEntry': {
        // Validate double-entry accounting requirements
        if (!data.debitAccountId || !data.creditAccountId) {
          return NextResponse.json(
            { error: 'Both debit and credit accounts are required' },
            { status: 400 }
          )
        }

        if (data.debitAccountId === data.creditAccountId) {
          return NextResponse.json(
            { error: 'Debit and credit accounts must be different' },
            { status: 400 }
          )
        }

        const amount = Number(data.amount)
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'Valid amount is required' },
            { status: 400 }
          )
        }

        // Generate unique journal number (format: JE-YYYYMMDD-XXXX)
        const today = new Date()
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
        const latestEntry = await prisma.journalEntry.findFirst({
          where: {
            journalNumber: {
              startsWith: `JE-${dateStr}`
            }
          },
          orderBy: {
            journalNumber: 'desc'
          }
        })

        let sequenceNumber = 1
        if (latestEntry) {
          const lastSeq = parseInt(latestEntry.journalNumber.split('-')[2])
          sequenceNumber = lastSeq + 1
        }
        const journalNumber = `JE-${dateStr}-${sequenceNumber.toString().padStart(4, '0')}`

        // Create journal entry with two detail lines (debit and credit)
        const journalEntry = await prisma.journalEntry.create({
          data: {
            journalNumber: journalNumber,
            date: new Date(data.date),
            totalAmount: amount,
            reference: data.reference,
            description: data.description,
            details: {
              create: [
                {
                  accountId: data.debitAccountId,
                  debit: amount,
                  credit: 0,
                  lineNumber: 1
                },
                {
                  accountId: data.creditAccountId,
                  debit: 0,
                  credit: amount,
                  lineNumber: 2
                }
              ]
            }
          },
          include: {
            details: {
              include: {
                account: true
              }
            }
          }
        })

        // Update debit account balance
        const debitAccount = await prisma.accountingAccount.findUnique({
          where: { id: data.debitAccountId }
        })

        if (debitAccount) {
          const newBalance = Number(debitAccount.balance) + amount
          await prisma.accountingAccount.update({
            where: { id: data.debitAccountId },
            data: { balance: newBalance }
          })
        }

        // Update credit account balance
        const creditAccount = await prisma.accountingAccount.findUnique({
          where: { id: data.creditAccountId }
        })

        if (creditAccount) {
          const newBalance = Number(creditAccount.balance) - amount
          await prisma.accountingAccount.update({
            where: { id: data.creditAccountId },
            data: { balance: newBalance }
          })
        }

        return NextResponse.json({ journalEntry })
      }

      case 'uploadDocument': {
        const formData = await request.formData()
        const entryId = formData.get('entryId') as string
        const file = formData.get('document') as File
        
        if (!entryId || !file) {
          return NextResponse.json(
            { error: 'Entry ID and document file are required' },
            { status: 400 }
          )
        }
        
        // Get the journal entry
        const entry = await prisma.journalEntry.findUnique({
          where: { id: entryId }
        })
        
        if (!entry) {
          return NextResponse.json(
            { error: 'Journal entry not found' },
            { status: 404 }
          )
        }
        
        // Upload the document
        const documentUrl = await handleDocumentUpload(file, entry.journalNumber)
        
        // Update the journal entry with document URL
        const updatedEntry = await prisma.journalEntry.update({
          where: { id: entryId },
          data: { documentUrl }
        })
        
        return NextResponse.json({ 
          success: true, 
          documentUrl,
          entry: updatedEntry 
        })
      }

      case 'updateJournalEntry': {
        if (!data.id) {
          return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
        }

        // Get existing entry with details to reverse balances
        const existingEntry = await prisma.journalEntry.findUnique({
          where: { id: data.id },
          include: { details: true }
        })

        if (!existingEntry) {
          return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
        }

        const newAmount = data.amount ? Number(data.amount) : existingEntry.totalAmount

        // Use transaction to ensure consistency
        const updatedEntry = await prisma.$transaction(async (tx) => {
          // Step 1: Reverse old account balances
          for (const detail of existingEntry.details) {
            const account = await tx.accountingAccount.findUnique({
              where: { id: detail.accountId }
            })
            if (account) {
              // Reverse: subtract debit, add credit
              const reversedBalance = Number(account.balance) - Number(detail.debit) + Number(detail.credit)
              await tx.accountingAccount.update({
                where: { id: detail.accountId },
                data: { balance: reversedBalance }
              })
            }
          }

          // Step 2: Delete old detail entries
          await tx.journalEntryDetail.deleteMany({
            where: { journalId: data.id }
          })

          // Step 3: Create new detail entries if accounts are provided
          const debitAccountId = data.debitAccountId || existingEntry.details.find(d => Number(d.debit) > 0)?.accountId
          const creditAccountId = data.creditAccountId || existingEntry.details.find(d => Number(d.credit) > 0)?.accountId

          if (debitAccountId && creditAccountId) {
            await tx.journalEntryDetail.createMany({
              data: [
                {
                  journalId: data.id,
                  accountId: debitAccountId,
                  debit: newAmount,
                  credit: 0,
                  lineNumber: 1
                },
                {
                  journalId: data.id,
                  accountId: creditAccountId,
                  debit: 0,
                  credit: newAmount,
                  lineNumber: 2
                }
              ]
            })

            // Step 4: Apply new account balances
            const debitAccount = await tx.accountingAccount.findUnique({
              where: { id: debitAccountId }
            })
            if (debitAccount) {
              await tx.accountingAccount.update({
                where: { id: debitAccountId },
                data: { balance: Number(debitAccount.balance) + Number(newAmount) }
              })
            }

            const creditAccount = await tx.accountingAccount.findUnique({
              where: { id: creditAccountId }
            })
            if (creditAccount) {
              await tx.accountingAccount.update({
                where: { id: creditAccountId },
                data: { balance: Number(creditAccount.balance) - Number(newAmount) }
              })
            }
          }

          // Step 5: Update journal entry header
          const updated = await tx.journalEntry.update({
            where: { id: data.id },
            data: {
              date: data.date ? new Date(data.date) : undefined,
              totalAmount: newAmount,
              reference: data.reference,
              description: data.description,
              documentUrl: data.documentUrl !== undefined ? (data.documentUrl || null) : undefined
            },
            include: {
              details: {
                include: {
                  account: true
                }
              }
            }
          })

          return updated
        })

        return NextResponse.json(convertDecimalsToNumbers({ journalEntry: updatedEntry }))
      }

      case 'deleteJournalEntry': {
        if (!data.id) {
          return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
        }

        // Get entry details to reverse balance updates
        const entry = await prisma.journalEntry.findUnique({
          where: { id: data.id },
          include: { details: true }
        })

        if (entry) {
          // Reverse account balances
          for (const detail of entry.details) {
            const account = await prisma.accountingAccount.findUnique({
              where: { id: detail.accountId }
            })

            if (account) {
              const newBalance = Number(account.balance) - Number(detail.debit) + Number(detail.credit)
              await prisma.accountingAccount.update({
                where: { id: detail.accountId },
                data: { balance: newBalance }
              })
            }
          }

          // Delete journal entry (details will cascade)
          await prisma.journalEntry.delete({
            where: { id: data.id }
          })
        }

        return NextResponse.json({ success: true })
      }

      case 'updateExpenseClassification': {
        const { accountId, classification } = body

        if (!accountId || !classification) {
          return NextResponse.json(
            { error: 'Account ID and classification are required' },
            { status: 400 }
          )
        }

        // Verify that the account is an expense account
        const account = await prisma.accountingAccount.findUnique({
          where: { id: accountId }
        })

        if (!account || account.type !== 'EXPENSE') {
          return NextResponse.json(
            { error: 'Account must be an expense account' },
            { status: 400 }
          )
        }

        const updated = await prisma.accountingAccount.update({
          where: { id: accountId },
          data: {
            expenseClassification: classification
          }
        })

        return NextResponse.json(convertDecimalsToNumbers({ account: updated }))
      }

      case 'bulkUpdateClassification': {
        const { accountIds, classification } = body

        if (!accountIds || !Array.isArray(accountIds) || !classification) {
          return NextResponse.json(
            { error: 'Account IDs array and classification are required' },
            { status: 400 }
          )
        }

        const updated = await prisma.accountingAccount.updateMany({
          where: {
            id: { in: accountIds },
            type: 'EXPENSE'
          },
          data: {
            expenseClassification: classification
          }
        })

        return NextResponse.json({
          count: updated.count,
          message: `Updated ${updated.count} expense account(s)`
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in accounting POST:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Alias to POST for update operations
  return POST(request)
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    if (type === 'account') {
      // Check if account has children
      const children = await prisma.accountingAccount.count({
        where: { parentId: id }
      })

      if (children > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with child accounts' },
          { status: 400 }
        )
      }

      // Check if account has entries
      const entries = await prisma.journalEntryDetail.count({
        where: { accountId: id }
      })

      if (entries > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with journal entries' },
          { status: 400 }
        )
      }

      await prisma.accountingAccount.delete({
        where: { id }
      })
    } else if (type === 'entry') {
      // Get entry details to reverse balance updates
      const entry = await prisma.journalEntry.findUnique({
        where: { id },
        include: { details: true }
      })

      if (entry) {
        // Reverse account balances
        for (const detail of entry.details) {
          const account = await prisma.accountingAccount.findUnique({
            where: { id: detail.accountId }
          })

          if (account) {
            const newBalance = Number(account.balance) - Number(detail.debit) + Number(detail.credit)
            await prisma.accountingAccount.update({
              where: { id: detail.accountId },
              data: { balance: newBalance }
            })
          }
        }

        await prisma.journalEntry.delete({
          where: { id }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in accounting DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
