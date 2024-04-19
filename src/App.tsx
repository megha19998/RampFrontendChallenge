import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    /*
    * BugFix 5
    * setIsLoading is setting the state variable isLoading
    * this isLoading variable is used in InputSelect tag
    * which is a component that is created ( src/components/InputSelect/index.tsx )
    * untill the isLoading is true, it will show ...is loading
    * as soon as it is set to false, it will display all the employees 
    * which is handled on line 94 of src/components/InputSelect/index.tsx
    * and we don't need to wait till all the transactions are loaded, as soon as we 
    * get list of employees, it should be set to false. 
    * hence moved the setIsLoading(false) statement 
    * above of the await paginatedTransactionsUtils.fetchAll() statement
    */
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])
  /*
  * BugFix 6
  * initially, on line 110, it was only looking at paginatedTransactionsUtils.loading. 
  * if it's true, the view more button is disabled else enabled. 
  * for part A) when there are no more paginatedTransactions, is should be true.
  * so, add the condition paginatedTransactions?.nextPage == null once this condition is met,
  * "disabled" will be set to true hence view more will be set to true. 
  * for partB) since I am checking "paginatedTransactions?", for searchByEmployeeId, we are not getting
  * paginatedTransactions, we are getting transactionsByEmployee hence when we select transactions by employee,
  * disabled will automaticallly be set to true. but I have added extra check. if the 
  * transactionsByEmployee length is zero, the disabled will be set to true. 
  */
  const disableOptionsWhenPaginatedTransactionLoading = paginatedTransactionsUtils.loading
  const disableOptionsWhenNoMorePaginatedTransactions = paginatedTransactions?.nextPage == null
  const paginatedDisabledOptions = disableOptionsWhenPaginatedTransactionLoading || disableOptionsWhenNoMorePaginatedTransactions
  const transactionByEmployeeDisabledOption = transactionsByEmployee?.length === 0
  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            /*
            * BugFix3
            * when I was going back from some employee to all employees,
            * I was getting empty ID.
            * so if no id is provided, that means we have selected all employees
            * and hence called loadAllTransaction() function
            */
            else if(newValue?.id === "") {
              await loadAllTransactions()
            }
            else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedDisabledOptions || transactionByEmployeeDisabledOption}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
