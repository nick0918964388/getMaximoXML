# ODPCS126 功能規格說明

**表單標題:** ENTRY STANDARD FORM

## 表頭欄位

| 欄位名稱 | 標籤 | 類型 | 資料類型 | 長度 | 提示說明 | LOV |
|----------|------|------|----------|------|----------|-----|
| MISC_TYPE | Misc Type | Text Item | Char | 16 | - | - |
| CR_NEW_ITEM | - | Text Item | Char | 10 | - | - |
| CR_ACCT_NO | - | Text Item | Char | 10 | - | - |
| ENTRY_OFFICE | Entry Office | Text Item | Char | 7 | - | - |
| ENTRY_USER | Entry User | Text Item | Char | 10 | - | - |
| ENTRY_DATE | Entry Date | Text Item | Datetime | 8 | - | - |
| ENTRY_PROGRAM | Entry Program | Text Item | Char | 20 | - | - |
| MODIFY_OFFICE | Modify Office | Text Item | Char | 7 | - | - |
| MODIFY_USER | Modify User | Text Item | Char | 10 | - | - |
| MODIFY_DATE | Modify Date | Text Item | Datetime | 8 | - | - |
| MODIFY_PROGRAM | Modify Program | Text Item | Char | 20 | - | - |
| O_NEW_ITEM | - | Text Item | Char | 10 | - | - |
| O_MONTH_DATE | - | Text Item | Date | 30 | - | - |
| O_BUDGET_CODE | - | Text Item | Char | 16 | - | - |
| O_STD_AMOUNT | - | Text Item | Number | 30 | - | - |
| O_DC_TYPE | - | Text Item | Char | 1 | - | - |
| DC_AMOUNT | - | Text Item | Number | 30 | - | - |
| PCS1004_SEQ | Pcs1004 Seq | Text Item | Number | 40 | - | - |
| F_AMOUNT | - | Text Item | Number | 30 | - | - |
| F_USD_AMOUNT | - | Text Item | Number | 30 | - | - |
| ENTRY_OFFICE | Entry Office | Text Item | Char | 7 | - | - |
| ENTRY_USER | Entry User | Text Item | Char | 10 | - | - |
| ENTRY_DATE | Entry Date | Text Item | Datetime | 11 | - | - |
| ENTRY_PROGRAM | Entry Program | Text Item | Char | 20 | - | - |
| MODIFY_OFFICE | Modify Office | Text Item | Char | 7 | - | - |
| MODIFY_USER | Modify User | Text Item | Char | 10 | - | - |
| MODIFY_DATE | Modify Date | Text Item | Datetime | 11 | - | - |
| MODIFY_PROGRAM | Modify Program | Text Item | Char | 20 | - | - |
| DC_AMT | - | Text Item | Number | 30 | - | - |
| DC_USD_AMT | - | Text Item | Number | 30 | - | - |
| DC_STD_AMT | - | Text Item | Number | 30 | - | - |
| SUM_AMT | - | Text Item | Number | 30 | - | - |
| SUM_USD_AMT | - | Text Item | Number | 30 | - | - |
| SUM_STD_AMT | - | Text Item | Number | 30 | - | - |
| TAX_USD_AMOUNT | - | Text Item | Number | 30 | - | - |
| SOURCE_TYPE | Source Type | Text Item | Char | 240 | - | - |
| ENTRY_USER | Entry User | Text Item | Char | 10 | - | - |
| ENTRY_DATE | Entry Date | Text Item | Datetime | 8 | - | - |
| ENTRY_OFFICE | Entry Office | Text Item | Char | 7 | - | - |
| ENTRY_PROGRAM | Entry Program | Text Item | Char | 20 | - | - |
| MODIFY_USER | Modify User | Text Item | Char | 10 | - | - |
| MODIFY_DATE | Modify Date | Text Item | Datetime | 8 | - | - |
| MODIFY_OFFICE | Modify Office | Text Item | Char | 7 | - | - |
| MODIFY_PROGRAM | Modify Program | Text Item | Char | 20 | - | - |
| SLIP_NO | Slip No | Text Item | Char | 32 | - | - |
| ARC1002_ID | Arc1002 Id | Text Item | Number | 40 | - | - |
| SLIP_REF_NO | Slip Ref No | Text Item | Char | 32 | - | - |
| SUM_TAX_AMT | - | Text Item | Number | 30 | - | - |
| SUM_TAX_USD_AMT | - | Text Item | Number | 30 | - | - |
| SUM_TAX_STD_AMT | - | Text Item | Number | 30 | - | - |
| SLIP_NO | Ispt No | Text Item | Char | 32 | - | - |
| SLIP_DATE | Ispt Date | Text Item | Date | 8 | YYYYMMDD | - |
| BEGIN_DATE | Begin Date | Text Item | Date | 8 | YYYYMMDD HH24:MI | - |
| END_DATE | End Date | Text Item | Date | 8 | YYYYMMDD HH24:MI | - |
| FORM_NAME_DISPLAY | - | Display Item | Char | 80 | - | - |
| FORM_ID_DISPLAY | - | Display Item | Char | 30 | - | - |
| USER_ID_DISPLAY | - | Display Item | Char | 30 | - | - |
| EXPENSE_USER | - | Text Item | Char | 30 | - | - |
| SUPPLY_CODE | Payee | Text Item | Char | 10 | - | LOV_SUPPLY1 |
| SUPPLY_NAME | - | Display Item | Char | 80 | - | - |
| POSITION | Position | Display Item | Char | 200 | - | - |
| DEPARTMENT_CODE | Department | Text Item | Char | 10 | - | - |
| DEPT_NAME | - | Text Item | Char | 100 | - | - |
| MISC_SUB_TYPE | - | List Item | Char | 16 | - | - |
| INVOICE_TYPE | InvoiceType | List Item | Char | 32 | - | - |
| TRACK_ID | Track | Text Item | Char | 2 | - | - |
| INVOICE_NO | Invoice No | Text Item | Char | 8 | - | - |
| TRACK_INVOICE | Track Invoice | Text Item | Char | 32 | - | - |
| INVOICE_DATE | Invoice Date | Text Item | Date | 8 | - | - |
| CUST_CODE | Cust Code | Text Item | Char | 32 | - | - |
| REG_NO | Reg No | Text Item | Char | 10 | - | - |
| INVOICE_FORMAT | Format | Text Item | Char | 32 | - | LOV_INVOICE_FORMAT |
| CUT_TYPE | Cut | Text Item | Char | 32 | - | LOV_CUT_TYPE |
| TAX_TYPE | Tax | Text Item | Char | 32 | - | LOV_TAX_TYPE |
| ADD_TYPE | Add | Check Box | Char | 10 | - | - |
| LINE_NO | L/N | Display Item | Number | 40 | - | - |
| DC_TYPE | Dr/Cr | List Item | Char | 1 | - | - |
| NET_TYPE | Net Type | List Item | Char | 6 | - | - |
| DESCRIPTION | Description | Text Item | Char | 200 | - | LOV_PAY_SUB_TYPE |
| REMARK | Remark | Text Item | Char | 200 | - | LOV_DEPT_CODE |
| NEW_ITEM | New Item | Text Item | Char | 32 | - | - |
| DEPARTMENT_CODE | Dept | Text Item | Char | 10 | - | LOV_DEPT_CODE |
| BUDGET_CODE | Code | Text Item | Char | 16 | - | LOV_CODE |
| BUDGET_AMOUNT | Budget Balance | Text Item | Number | 32 | - | - |
| MONTH_DATE | Month Date | Text Item | Date | 11 | YYYYMM | - |
| PSN_ID | Employee | Text Item | Char | 10 | - | LOV_PSN_ID |
| PSN_NAME | - | Display Item | Char | 80 | - | - |
| PAYMENT_TERM | Pay Term | Text Item | Char | 30 | - | LOV_PAYMENT_TERM |
| PAYMENT_METHOD | Pay Method | Text Item | Char | 30 | - | LOV_PAYMENT_METHOD |
| DUE_DATE | Due Date | Text Item | Date | 30 | - | - |
| CURR | Curr | Text Item | Char | 3 | - | - |
| AMOUNT | Amount | Text Item | Number | 40 | - | - |
| CURR_USD_RATE | C/U Rate | Text Item | Number | 40 | - | - |
| USD_AMOUNT | Usd Amount | Text Item | Number | 40 | - | - |
| USD_STD_RATE | U/S Rate | Text Item | Number | 40 | - | - |
| STD_AMOUNT | Std Amount | Text Item | Number | 40 | - | - |
| TAX_STD_AMOUNT | Tax Std Amt | Text Item | Number | 40 | - | - |
| TAX_AMOUNT | Tax Amt | Text Item | Number | 30 | - | - |
| AREA_CODE | Area Code | List Item | Char | 32 | - | - |
| CURR | Curr | Text Item | Char | 16 | - | LOV_CURR_B2 |
| AMOUNT | Amount | Text Item | Number | 40 | - | - |
| CURR_USD_RATE | Curr Usd Rate | Text Item | Number | 40 | - | - |
| USD_AMOUNT | Usd Amount | Text Item | Number | 40 | - | - |
| USD_STD_RATE | Usd Std Rate | Text Item | Number | 40 | - | - |
| STD_AMOUNT | Std Amount | Text Item | Number | 30 | - | - |
| AGAINST_NO | Offset No | Text Item | Char | 32 | - | LOV_AGAINST_NO |
| PLACE_CODE | Destination | Text Item | Char | 32 | - | LOV_PLACE_CODE |
| TREVEL_PLACE | Belong Place | Text Item | Char | 30 | 費用歸屬地 | LOV_BT_PLACE |
| AUDITOR | - | Display Item | Char | 10 | - | - |
| VOUCHER_NO | Vou No | Display Item | Char | 32 | - | - |
| AUDIT_FLAG | Acct Flag | Check Box | Char | 32 | - | - |
| NATION_CODE | Nation  | Text Item | Char | 2 | - | - |
| TRAVEL_PLACE | Reason | Text Item | Char | 400 | - | - |
| TT_AMT | Pay Amount | Text Item | Number | 32 | - | - |
| TOTAL_AMT | Pay Amount | Text Item | Number | 32 | - | - |
| TO_AMT | Pay Amount | Text Item | Number | 32 | - | - |
| PAY_SUB_TYPE | Exp Type | Text Item | Char | 32 | - | - |
| ACCT_NO | Acct No | Display Item | Char | 10 | - | - |
| SLIP_NO | Slip No | Text Item | Char | 32 | - | - |
| CREDIT_NO | Credit No | Text Item | Char | 32 | - | - |
| F_USD_AMT | - | Text Item | Number | 40 | - | - |
| F_STD_AMT | - | Text Item | Number | 40 | - | - |
| F_TAX_AMT | - | Text Item | Number | 40 | - | - |
| CURR | Request Currency | Text Item | Char | 3 | - | - |
| AMOUNT | Amount | Text Item | Number | 40 | - | - |
| F_STD_AMOUNT | Sum amount | Display Item | Number | 40 | - | - |
| F_INV_USD_AMOUNT | - | Text Item | Number | 30 | - | - |
| F_INV_TAX_USD_AMOUNT | - | Text Item | Number | 30 | - | - |
| F_INV_STD_AMOUNT | - | Text Item | Number | 30 | - | - |
| F_INV_TAX_STD_AMOUNT | - | Text Item | Number | 30 | - | - |
| F_INV_AMOUNT | - | Text Item | Number | 30 | - | - |
| F_INV_TAX_AMOUNT | - | Text Item | Number | 30 | - | - |

## 按鈕

- **PUSH_BUTTON184**: Certificate
- **PUSH_HELP**: HELP
- **SUPPORTING**: Supporting
- **LIST**: 報告單
- **INSERT_DEFAULT_DATA**: Get  Default Data  From  ODPCS102

## LOV (下拉選單)

| LOV名稱 | 標題 | Record Group |
|---------|------|--------------|
| LOV_CURR_B2 | Currency | G_CURR_B2 |
| LOV_INVOICE_FORMAT | - | G_INVOICE_FORMAT |
| LOV_CUT_TYPE | - | G_CUT_TYPE |
| LOV_TAX_TYPE | - | G_TAX_TYPE |
| LOV_PAYMENT_TERM | - | G_PAYMENT_TERM |
| LOV_PAYMENT_METHOD | Payment Method | G_PAYMENT_METHOD |
| LOV_PLACE_CODE | - | G_PLACE_CODE |
| LOV_BT_PLACE | - | G_PLACE_CODE |
| LOV_PSN_ID | - | G_PSN_ID |
| LOV_CODE | - | G_CODE |
| LOV_DEPT_CODE | - | G_DEPT_CODE |
| LOV_AGAINST_NO | - | G_AGAINST_NO |
| LOV_PAY_SUB_TYPE | - | G_PAY_SUB_TYPE |
| LOV_SUPPLY | Suppply Code | G_SUPPLY_CODE |
| LOV_SUPPLY1 | Payee | G_SUPPLY_CODE1 |
