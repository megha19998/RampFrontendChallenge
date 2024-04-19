import { useCallback } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  /*
  * BugFix 7 
  * if we go and look at PaginatedTransactions and Transactionsbyemployee, 
  * they are using fetchWithCache, so It is important to clear the 
  * old state of transaction from the cache (which we are doing on line 22)
  */
    const { fetchWithoutCache, loading, clearCacheByEndpoint } = useCustomFetch()
    
    const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
      async ({ transactionId, newValue }) => {
        await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
          transactionId,
          value: newValue,
        })
        clearCacheByEndpoint(["transactionsByEmployee", "paginatedTransactions"])
      },
      [fetchWithoutCache, clearCacheByEndpoint]
    )

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
