'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/pages/components/dialog'
import { Button } from '@/app/pages/components/button'
import { Badge } from '@/app/pages/components/badge'
import { Clock, User, FileText, DollarSign, Calendar, Tag } from 'lucide-react'
import { useLanguage } from '@/utils/LanguageContext'

interface TransactionVersion {
  id: string
  version: number
  type: string
  category: string
  amount: number
  description: string
  descriptionAr?: string
  reference?: string
  transactionDate: string
  createdAt: string
  editedBy?: string
  editReason?: string
  driver?: { name: string; employeeId: string }
  platform?: { name: string }
  vehicle?: { plateNumber: string }
}

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  transactionNumber: string
  currentTransaction: any
}

export default function TransactionHistoryModal({
  isOpen,
  onClose,
  transactionNumber,
  currentTransaction
}: TransactionHistoryModalProps) {
  const { t } = useLanguage()
  const [history, setHistory] = useState<TransactionVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<TransactionVersion | null>(null)

  useEffect(() => {
    if (isOpen && transactionNumber) {
      fetchTransactionHistory()
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedVersion(null)
      setHistory([])
    }
  }, [isOpen, transactionNumber])

  const fetchTransactionHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/accounting/${transactionNumber}?includeHistory=true`)
      const data = await response.json()

      if (data.success) {
        setHistory(data.data.history || [])
        // Don't reset selectedVersion here - let user's clicks control it
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVersionClick = (version: TransactionVersion | null) => {
    setSelectedVersion(version)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-QA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME': return 'bg-green-100 text-green-800'
      case 'EXPENSE': return 'bg-red-100 text-red-800'
      case 'TRANSFER': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderTransactionDetails = (transaction: TransactionVersion | any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Type</span>
          </div>
          <Badge className={getTypeColor(transaction.type)}>
            {transaction.type}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Amount</span>
          </div>
          <span className="text-lg font-semibold">
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Description</span>
        </div>
        <p className="text-sm text-gray-700">{transaction.description}</p>
        {transaction.descriptionAr && (
          <p className="text-sm text-gray-600 italic">{transaction.descriptionAr}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Transaction Date</span>
          </div>
          <span className="text-sm">{formatDate(transaction.transactionDate)}</span>
        </div>

        {transaction.reference && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Reference</span>
            </div>
            <span className="text-sm font-mono">{transaction.reference}</span>
          </div>
        )}
      </div>

      {(transaction.driver || transaction.platform || transaction.vehicle) && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Related Information</span>
          <div className="text-sm text-gray-600 space-y-1">
            {transaction.driver && (
              <div>Driver: {transaction.driver.name} ({transaction.driver.employeeId})</div>
            )}
            {transaction.platform && (
              <div>Platform: {transaction.platform.name}</div>
            )}
            {transaction.vehicle && (
              <div>Vehicle: {transaction.vehicle.plateNumber}</div>
            )}
          </div>
        </div>
      )}

      {transaction.editReason && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Edit Information</span>
          </div>
          <div className="text-sm text-gray-600">
            <div>Reason: {transaction.editReason}</div>
            {transaction.editedBy && <div>Edited by: {transaction.editedBy}</div>}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History - {transactionNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[60vh]">
          {/* History Timeline */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="font-medium mb-4">Version History</h3>
            <div className="h-full overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {/* Current Version */}
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      !selectedVersion ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleVersionClick(null)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default">Current (v{currentTransaction.version})</Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(currentTransaction.updatedAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(currentTransaction.amount)}
                    </div>
                    {currentTransaction.editedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        by {currentTransaction.editedBy}
                      </div>
                    )}
                  </div>

                  {/* Historical Versions */}
                  {history.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleVersionClick(version)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">v{version.version}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(version.amount)}
                      </div>
                      {version.editedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          by {version.editedBy}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="flex-1">
            <h3 className="font-medium mb-4">
              {selectedVersion ? `Version ${selectedVersion.version} Details` : 'Current Version Details'}
            </h3>
            <div className="h-full overflow-y-auto">
              {renderTransactionDetails(selectedVersion || currentTransaction)}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
