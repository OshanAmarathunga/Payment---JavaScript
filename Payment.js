//This script send data to OVPM/VPMx (/VendorPayments) from Sap Stage after 2nd Payment Approval of the Fixed asset app


//####################################################################
//### To test the login credentials uncomment and add the relevant ###
//### credentials (test/live). Then select the function as         ###
//### loginToSap() and Run and check the log for sessionId         ###
//####################################################################

//test server


//##########################################################
//### To proccess the bank integration using this script ###
//### You must change the BANK port and uncomment the    ###
//### bank integration at the end of the SAP integration ###
//##########################################################


function loginToSap() {
  var url = IP_ADDRESS+"/b1s/v1/Login";

  console.log("url :", url);

  var data = {
    "CompanyDB": COMPANY_DB,
    "UserName": USER_NAME,
    "Password": PASSWORD
  }

  var options = {
    'method': 'post',
    'payload': JSON.stringify(data),
    'muteHttpExceptions': true,
    'validateHttpsCertificates': false
  };

  var response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() == 200 || response.getResponseCode() == 201) {
    var json = JSON.parse(response.getContentText());
    console.log("json :", json);
    return json["SessionId"];
  } else {
    throw new Error("Error logging in to SAP server: " + response.getResponseCode());
  }
}

// OVPM	| Outgoing Payments		
// VPM1	| Check Payments - Details		|     |Cheque Payments
// VPM2 |	Payment Invoices - Details	|	    |Settlement
// VPM4	| Payment Accounts - Details	|OPCH	|GL Payments

function sendToVendorPayments(ModOfPayment,DocType,DocDate,CardCode,DocCurrency,CheckAccount,CheckSum,CounterReference,Remarks,U_SourceRef,U_TR_Source,VPM1_CheckNumber,VPM1_BankCode,VPM1_AccounttNum,VPM1_Trnsfrable,VPM1_CheckSum ,VPM1_Currency ,VPM1_CheckAccount ,VPM1_ManualCheck,  TransferAccount,TransferSum,TransferDate,TransferReference,VPM4_AccountCode,U_FundTransfer_To,U_FundTransfer_ToName,VPM4_SumPaid,U_Payment_Method,U_Purpose,U_RemitanceCode,U_ChargeBourned,U_SignatureRequired,U_Approver01,U_Approver02,U_FundTransfer,VPM2_PaymentInvoiceDocEntryList,VPM2_PaymentInvoicePaidSumList,PDN1_AcctCode) {


  var sessionId = PropertiesService.getScriptProperties().getProperty('sessionId');
  var sessionTime = PropertiesService.getScriptProperties().getProperty('sessionTime');
  console.log("sessionTime :", sessionTime)

  var currentTime = new Date().getTime();
  if (!sessionId || !sessionTime || (currentTime - sessionTime) > (30 * 60 * 1000)) {
    // Obtain a new session id
    sessionId = loginToSap();

    console.log("New Session ID :", sessionId);
    PropertiesService.getScriptProperties().setProperty('sessionId', sessionId);
    PropertiesService.getScriptProperties().setProperty('sessionTime', currentTime);
  }

  var documentEntry=VPM2_PaymentInvoiceDocEntryList;
  if(documentEntry==null ){
   return{
    sapContentText: "Not found approved document number from SAP. Please approve this invoice in SAP"
   };
  }
  








  var url = IP_ADDRESS+'/b1s/v1/VendorPayments';
 

//Creating transfer/cheque obj (OVPM)

console.log("DocEntry :", VPM2_PaymentInvoiceDocEntryList);
console.log("VPM2_PaymentInvoicePaidSumList :", VPM2_PaymentInvoicePaidSumList);
console.log("DocType :", DocType);
// console.log("PCH1_AcctCode :", PDN1_AcctCode);
console.log("ModOfPayment : ",ModOfPayment);
console.log("CardCode : ",CardCode);
console.log("CheckAccount : ",CheckAccount);
console.log("CounterReference : ",CounterReference);
console.log("U_SourceRef : ",U_SourceRef);
console.log("VPM1_CheckNumber : ",VPM1_CheckNumber);
console.log("VPM1_BankCode : ",VPM1_BankCode);
console.log("VPM1_AccounttNum : ",VPM1_AccounttNum);
console.log("VPM1_CheckSum : ",VPM1_CheckSum);
console.log("VPM1_CheckAccount : ",VPM1_CheckAccount);
console.log("TransferAccount : ",TransferAccount);
console.log("VPM4_AccountCode : ",VPM4_AccountCode);
console.log("U_FundTransfer_To : ",U_FundTransfer_To);
console.log("U_FundTransfer_ToName : ",U_FundTransfer_ToName);
console.log("VPM4_SumPaid : ",VPM4_SumPaid);
console.log("U_Payment_Method : ",U_Payment_Method);
console.log("U_Purpose : ",U_Purpose);
console.log("U_RemitanceCode : ",U_RemitanceCode);
console.log("U_Approver01 : ",U_Approver01);
console.log("U_Approver02 : ",U_Approver02);

var _docEntryList = documentEntry;
var _paymentInvoicePaidSumList = VPM2_PaymentInvoicePaidSumList;
// var _acctCodeList = PDN1_AcctCode;

if(_docEntryList != null){

//Multiple Invoices handling : Creating payment invoices object (VPM2)

    console.log("_docEntryList :", _docEntryList);
    console.log("_paymentInvoicePaidSumList :", _paymentInvoicePaidSumList);


 // Define the array list
  var DocEntryList = [];
  var PaidSumList = [];
  var AcctCodeList = [];
  
  DocEntryList = _docEntryList.split(' , ').map(function(value) {
    return parseFloat(value.replace(/,/g, ''));
  });
 
  PaidSumList = _paymentInvoicePaidSumList.split(' , ').map(function(value) {
    return parseFloat(value.replace(/,/g, ''));
  });
  
  // AcctCodeList = _acctCodeList.split(' , ');

  // Create an empty obj to hold the list of invoices
  var paymentInvoiceObjects = [];

    // for customer "InvoiceType": "it_CredItnote",
    // for supplier "InvoiceType": "it_PurchaseInvoice",

  var InvoiceType = '';                
  if(DocType =='S'){
    InvoiceType = 'it_PurchaseInvoice'
  }

  if(DocType =='C'){
    InvoiceType = 'it_CredItnote'
  }

  console.log("DocEntryList : ",DocEntryList);
  console.log("PaidSumList : ",PaidSumList);

  //assigning value for invoice obj
  for (var i = 0; i < DocEntryList.length; i++) {
    var paymentInvoiceObject = {
                    "LineNum": i,
                    "DocEntry": DocEntryList[i],
                    "AppliedFC": 0.0,
                    "DocRate": 0.0,
                    "DocLine": 0,
                    "InvoiceType": InvoiceType,
                    "DiscountPercent": 0.0,
                    "PaidSum": PaidSumList[i]* 1.0,
                    "InstallmentId": 1,
                    "WitholdingTaxApplied": 0.0,
                    "WitholdingTaxAppliedFC": 0.0,
                    "WitholdingTaxAppliedSC": 0.0,
                    "LinkDate": null,
                    "DistributionRule": null,
                    "DistributionRule2": null,
                    "DistributionRule3": null,
                    "DistributionRule4": null,
                    "DistributionRule5": null,
                    "TotalDiscount": 0.0,
                    "TotalDiscountFC": 0.0,
                    "TotalDiscountSC": 0.0
                };
    paymentInvoiceObjects.push(paymentInvoiceObject);
  }

  console.log("paymentInvoiceObjects :", paymentInvoiceObjects)

  //Check Payments  (OVPM+VPM1)
  var jsonForChecks = {
            "DocType": DocType,
            "HandWritten": "tNO",
            "Printed": "tNO",
            "DocDate": DocDate,
            "CardCode": CardCode,
            "CardName": null,
            "Address": null,
            "CashAccount": null,
            "DocCurrency": DocCurrency,
            "CashSum": 0.0,
            "CheckAccount": CheckAccount,
            "TransferAccount": null,
            "TransferSum": 0.0,
            "TransferDate": null,
            "TransferReference": null,
            "LocalCurrency": "tNO",
            "DocRate": 0.0,
            "Reference1": null,
            "Reference2": null,
            "CounterReference": CounterReference,
            "Remarks": Remarks,
            "JournalRemarks": null,
            "SplitTransaction": "tNO",
            "ContactPersonCode": null,
            "ApplyVAT": "tNO",
            "TaxDate": DocDate,
            "Series": null,
            "BankCode": null,
            "BankAccount": null,
            "DiscountPercent": 0.0,
            "ProjectCode": null,
            "CurrencyIsLocal": "tNO",
            "DeductionPercent": 0.0,
            "DeductionSum": 0.0,
            "CashSumFC": 0.0,
            "CashSumSys": 0.0,
            "BoeAccount": null,
            "BillOfExchangeAmount": 0.0,
            "BillofExchangeStatus": null,
            "BillOfExchangeAmountFC": 0.0,
            "BillOfExchangeAmountSC": 0.0,
            "BillOfExchangeAgent": null,
            "WTCode": null,
            "WTAmount": 0.0,
            "WTAmountFC": 0.0,
            "WTAmountSC": 0.0,
            "WTAccount": null,
            "WTTaxableAmount": 0.0,
            "Proforma": "tNO",
            "PayToBankCode": null,
            "PayToBankBranch": null,
            "PayToBankAccountNo": null,
            "PayToCode": null,
            "PayToBankCountry": null,
            "IsPayToBank": "tNO",
            "DocEntry": null,
            "PaymentPriority": "bopp_Priority_6",
            "TaxGroup": null,
            "BankChargeAmount": 0.0,
            "BankChargeAmountInFC": 0.0,
            "BankChargeAmountInSC": 0.0,
            "UnderOverpaymentdifference": 0.0,
            "UnderOverpaymentdiffSC": 0.0,
            "WtBaseSum": 0.0,
            "WtBaseSumFC": 0.0,
            "WtBaseSumSC": 0.0,
            "VatDate": DocDate,
            "TransactionCode": "",
            "PaymentType": "bopt_None",
            "TransferRealAmount": 0.0,
            "DocObjectCode": "bopot_OutgoingPayments",
            "DocTypte": DocType,
            "DueDate": DocDate,
            "LocationCode": null,
            "Cancelled": "tNO",
            "ControlAccount": null,
            "UnderOverpaymentdiffFC": 0.0,
            "AuthorizationStatus": "pasWithout",
            "BPLID": null,
            "BPLName": null,
            "VATRegNum": null,
            "BlanketAgreement": null,
            "PaymentByWTCertif": "tNO",
            "Cig": null,
            "Cup": null,
            "AttachmentEntry": null,
            "SignatureInputMessage": null,
            "SignatureDigest": null,
            "CertificationNumber": null,
            "PrivateKeyVersion": null,
            "EDocExportFormat": null,
            "ElecCommStatus": null,
            "ElecCommMessage": null,
            "SplitVendorCreditRow": "tNO",
            "U_Payment_Method": U_Payment_Method,
            "U_Purpose": U_Purpose,
            "U_RemitanceCode": U_RemitanceCode,
            "U_ChargeBourned": U_ChargeBourned,
            "U_FileCreated": "No",
            "U_TR_Source": U_TR_Source,
            "U_FundTransfer": U_FundTransfer,
            "U_FundTransfer_To": U_FundTransfer_To,
            "U_FundTransfer_ToName": U_FundTransfer_ToName,
            "U_SourceRef": U_SourceRef,
            "U_SignatureRequired": U_SignatureRequired,
            "U_Approver01": U_Approver01,
            "U_Approver02": U_Approver02,
            "PaymentChecks": [
                {
                    "LineNum": 0,
                    "DueDate": DocDate,
                    "CheckNumber": VPM1_CheckNumber,
                    "BankCode": VPM1_BankCode,
                    "Branch": null,
                    "AccounttNum": VPM1_AccounttNum,
                    "Details": null,
                    "Trnsfrable": VPM1_Trnsfrable,
                    "CheckSum": VPM1_CheckSum* 1.0,
                    "Currency": VPM1_Currency,
                    "CountryCode": null,
                    "CheckAbsEntry": null,
                    "CheckAccount": VPM1_CheckAccount,
                    "ManualCheck": VPM1_ManualCheck,
                    "FiscalID": null,
                    "OriginallyIssuedBy": null,
                    "Endorse": "tNO",
                    "EndorsableCheckNo": null,
                    "ECheck": "tNO"
                }
            ],
            "PaymentInvoices": paymentInvoiceObjects,
            "PaymentCreditCards": [],
            "PaymentAccounts": [],
            "PaymentDocumentReferencesCollection": [],
            "BillOfExchange": {},
            "WithholdingTaxCertificatesCollection": [],
            "ElectronicProtocols": [],
            "CashFlowAssignments": [],
            "Payments_ApprovalRequests": [],
            "WithholdingTaxDataWTXCollection": []
        }

  //Transfer Payments (OVPM+VPM2)
  var jsonForTransfer =  {
            "DocType": DocType,
            "HandWritten": "tNO",
            "Printed": "tNO",
            "DocDate": DocDate,
            "CardCode": CardCode,
            "CardName": null,
            "Address": null,
            "CashAccount": null,
            "DocCurrency": DocCurrency,
            "CashSum": 0.0,
            "CheckAccount": null,
            "TransferAccount": TransferAccount,
            "TransferSum": TransferSum* 1.0,
            "TransferDate": TransferDate,
            "TransferReference": TransferReference,
            "LocalCurrency": "tNO",
            "DocRate": 0.0,
            "Reference1": null,
            "Reference2": null,
            "CounterReference": CounterReference,
            "Remarks": Remarks,
            "JournalRemarks": null,
            "SplitTransaction": "tNO",
            "ContactPersonCode": null,
            "ApplyVAT": "tNO",
            "TaxDate": DocDate,
            "Series": null,
            "BankCode": null,
            "BankAccount": null,
            "DiscountPercent": 0.0,
            "ProjectCode": null,
            "CurrencyIsLocal": "tNO",
            "DeductionPercent": 0.0,
            "DeductionSum": 0.0,
            "CashSumFC": 0.0,
            "CashSumSys": 0.0,
            "BoeAccount": null,
            "BillOfExchangeAmount": 0.0,
            "BillofExchangeStatus": null,
            "BillOfExchangeAmountFC": 0.0,
            "BillOfExchangeAmountSC": 0.0,
            "BillOfExchangeAgent": null,
            "WTCode": null,
            "WTAmount": 0.0,
            "WTAmountFC": 0.0,
            "WTAmountSC": 0.0,
            "WTAccount": null,
            "WTTaxableAmount": 0.0,
            "Proforma": "tNO",
            "PayToBankCode": null,
            "PayToBankBranch": null,
            "PayToBankAccountNo": null,
            "PayToCode": null,
            "PayToBankCountry": null,
            "IsPayToBank": "tNO",
            "DocEntry": null,
            "PaymentPriority": "bopp_Priority_6",
            "TaxGroup": null,
            "BankChargeAmount": 0.0,
            "BankChargeAmountInFC": 0.0,
            "BankChargeAmountInSC": 0.0,
            "UnderOverpaymentdifference": 0.0,
            "UnderOverpaymentdiffSC": 0.0,
            "WtBaseSum": 0.0,
            "WtBaseSumFC": 0.0,
            "WtBaseSumSC": 0.0,
            "VatDate": DocDate,
            "TransactionCode": "",
            "PaymentType": "bopt_None",
            "TransferRealAmount": 0.0,
            "DocObjectCode": "bopot_OutgoingPayments",
            "DocTypte": DocType,
            "DueDate": DocDate,
            "LocationCode": null,
            "Cancelled": "tNO",
            "ControlAccount": null,
            "UnderOverpaymentdiffFC": 0.0,
            "AuthorizationStatus": "pasWithout",
            "BPLID": null,
            "BPLName": null,
            "VATRegNum": null,
            "BlanketAgreement": null,
            "PaymentByWTCertif": "tNO",
            "Cig": null,
            "Cup": null,
            "AttachmentEntry": null,
            "SignatureInputMessage": null,
            "SignatureDigest": null,
            "CertificationNumber": null,
            "PrivateKeyVersion": null,
            "EDocExportFormat": null,
            "ElecCommStatus": null,
            "ElecCommMessage": null,
            "SplitVendorCreditRow": "tNO",
            "U_Payment_Method": U_Payment_Method,
            "U_Purpose": U_Purpose,
            "U_RemitanceCode": U_RemitanceCode,
            "U_ChargeBourned": U_ChargeBourned,
            "U_FileCreated": "No",
            "U_TR_Source": U_TR_Source,
            "U_FundTransfer": U_FundTransfer,
            "U_FundTransfer_To": U_FundTransfer_To,
            "U_FundTransfer_ToName": U_FundTransfer_ToName,
            "U_SourceRef": U_SourceRef,
            "U_SignatureRequired": U_SignatureRequired,
            "U_Approver01": U_Approver01,
            "U_Approver02": U_Approver02,
            "PaymentChecks": [],
            "PaymentInvoices": paymentInvoiceObjects,
            "PaymentCreditCards": [],
            "PaymentAccounts": [],
            "PaymentDocumentReferencesCollection": [],
            "BillOfExchange": {},
            "WithholdingTaxCertificatesCollection": [],
            "ElectronicProtocols": [],
            "CashFlowAssignments": [],
            "Payments_ApprovalRequests": [],
            "WithholdingTaxDataWTXCollection": []
        }
}

  //Gl payments (OVPM+VPM4)
  var jsonForGl = {
    "DocType": DocType,
    "HandWritten": "tNO",
    "DocDate": DocDate,
    "CardCode": CardCode,
    "CardName": null,
    "Address": null,
    "CashAccount": null,
    "DocCurrency": DocCurrency,
    "CashSum": 0.0,
    "CheckAccount": null,
    "TransferAccount": TransferAccount,
    "TransferSum": TransferSum* 1.0,
    "TransferDate": DocDate,
    "TransferReference": U_SourceRef,
    "LocalCurrency": "tNO",
    "DocRate": 0.0,
    "Reference1": null,
    "Reference2": null,
    "CounterReference": CounterReference,
    "Remarks": Remarks,
    "JournalRemarks": null,
    "SplitTransaction": "tNO",
    "ContactPersonCode": null,
    "ApplyVAT": "tNO",
    "TaxDate": null,
    "Series": null,
    "BankCode": "",
    "BankAccount": "",
    "DiscountPercent": 0.0,
    "ProjectCode": null,
    "CurrencyIsLocal": "tNO",
    "DeductionPercent": 0.0,
    "DeductionSum": 0.0,
    "CashSumFC": 0.0,
    "CashSumSys": 0.0,
    "BoeAccount": null,
    "BillOfExchangeAmount": 0.0,
    "BillofExchangeStatus": null,
    "BillOfExchangeAmountFC": 0.0,
    "BillOfExchangeAmountSC": 0.0,
    "BillOfExchangeAgent": null,
    "WTCode": null,
    "WTAmount": 0.0,
    "WTAmountFC": 0.0,
    "WTAmountSC": 0.0,
    "WTAccount": null,
    "WTTaxableAmount": 0.0,
    "Proforma": "tNO",
    "PayToBankCode": null,
    "PayToBankBranch": null,
    "PayToBankAccountNo": null,
    "PayToCode": null,
    "PayToBankCountry": null,
    "IsPayToBank": "tNO",
    "DocEntry": null,
    "PaymentPriority": "bopp_Priority_6",
    "TaxGroup": null,
    "BankChargeAmount": 0.0,
    "BankChargeAmountInFC": 0.0,
    "BankChargeAmountInSC": 0.0,
    "UnderOverpaymentdifference": 0.0,
    "UnderOverpaymentdiffSC": 0.0,
    "WtBaseSum": 0.0,
    "WtBaseSumFC": 0.0,
    "WtBaseSumSC": 0.0,
    "VatDate": null,
    "TransactionCode": null,
    "PaymentType": "bopt_None",
    "TransferRealAmount": 0.0,
    "DocObjectCode": "bopot_OutgoingPayments",
    "DocTypte": DocType,
    "DueDate": null,
    "LocationCode": null,
    "Cancelled": "tNO",
    "ControlAccount": null,
    "UnderOverpaymentdiffFC": 0.0,
    "AuthorizationStatus": "pasWithout",
    "BPLID": null,
    "BPLName": null,
    "VATRegNum": null,
    "BlanketAgreement": null,
    "PaymentByWTCertif": "tNO",
    "Cig": null,
    "Cup": null,
    "AttachmentEntry": null,
    "U_Payment_Method": U_Payment_Method,
    "U_Purpose": U_Purpose,
    "U_RemitanceCode": U_RemitanceCode,
    "U_ChargeBourned": U_ChargeBourned,
    "PaymentChecks": [],
    "PaymentInvoices": [],
    "PaymentCreditCards": [],
    "PaymentAccounts": [
        {
            "LineNum": 0,
            // "AccountCode": AcctCodeList[i],
            "AccountCode": VPM4_AccountCode,
            "SumPaid": VPM4_SumPaid* 1.0
        }
    ]
}


  var finalJson = {};

  if(ModOfPayment=='Transfer'){
    finalJson = jsonForTransfer;
  } 
  else if (ModOfPayment=='Cheque'){
    finalJson = jsonForChecks;
  }
  else{
    finalJson = null;
  }

  console.log("finalJson :", finalJson);

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Cookie': 'B1SESSION=' + sessionId
    },    
    'muteHttpExceptions': true,
    'validateHttpsCertificates': false,
    'payload': JSON.stringify(finalJson)
  };
  var response = UrlFetchApp.fetch(url, options);

  var resCode = response.getResponseCode();
  var resContent = response.getContentText();



  // Parse the JSON object
  var json_data = JSON.parse(resContent);

  //console.log("response content :", doc_num);
  console.log("response code :", resCode);
  console.log("resContent :", resContent);


  // Extract the value of "DocNum","DocEntry","Series"
  var doc_num = json_data.DocNum;
  var doc_entry = json_data.DocEntry;
  var doc_series = json_data.Series;
  var cardCode=json_data.CardCode;
  var supplierName=json_data.CardName;
  var amount=json_data.TransferSum;
  var reference=json_data.TransferReference;


  console.log("response doc_num :", doc_num);
  console.log("response doc_entry :", doc_entry);
  console.log("response doc_series :", doc_series);

var bankResponse = {
    bankResponseCode : 0,
    bankContentText: null
  };

  return {
    sapResponseCode : resCode,
    sapContentText: resContent,
    bankResponseCode: bankResponse.bankResponseCode,
    bankContentText: bankResponse.bankContentText,
    Doc_Entry:doc_entry,
    cardCode:cardCode,
    supplierName:supplierName,
    amount:amount,
    reference:reference,
    docNum:doc_num

  };

// if(doc_entry != null){

//   var bank = null;
//   var docEntryId = doc_entry;
//   var transactionType = 1; //Default value is 1
//   var bankType = null;

//   var bank_id = null;

//   if(bank == "NTB"){
//     bankType = 1;
//   } 
//   else if(bank == "DFCC"){
//     bankType = 2;
//   } else {
//     bankType = 0;
//   }

//   bankResponse = passToBank(bankType, transactionType, docEntryId)
// }


//GL Attachments (Not in the Requirement)

// if(_file_links != null){

//   // Define the array list
//   var links = [];

//   links = _file_links.split(' , ');
//   console.log("links :", links);


//   // Define the ID and date for the JSON object
//   var id = 1;
//   var formattedDate = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd");
//   var formattedTime = Utilities.formatDate(new Date(), "GMT+5:30", "HH:mm:ss");


//     Logger.log("Time",formattedDate);
//     Logger.log("Date",formattedTime);


//   // Create an empty array to hold the link objects
//   var linkObjects = [];

//   // Loop through the links array and create a link object for each link
//   for (var i = 0; i < links.length; i++) {
//     var linkObject = {
//                       "Code": doc_num,
//                       "LineId": i+1,
//                       "Object": "Attachment",
//                       "LogInst": null,
//                       "U_URL": links[i]
//                   };
//     linkObjects.push(linkObject);
//   }

//   // Create the final JSON object
//   var jsonDataAttachment = {
//               "Code": doc_num,
//               "Name": null,
//               "DocEntry": doc_num,
//               "Canceled": "N",
//               "Object": "Attachment",
//               "LogInst": null,
//               "UserSign": 7,
//               "Transfered": "N",
//               "CreateDate": formattedDate,
//               "CreateTime": formattedTime,
//               "UpdateDate": formattedDate,
//               "UpdateTime": formattedTime,
//               "DataSource": "I",
//               "ATT1Collection": linkObjects
//   }

//   // Log the JSON object to the console
//   console.log(jsonDataAttachment);

//   var urlAttachment = IP_ADDRESS+'/b1s/v1/Attachment';

//   var options = {
//       'method': 'post',
//       'contentType': 'application/json',
//       'headers': {
//         'Cookie': 'B1SESSION=' + sessionId
//       },    
//       'muteHttpExceptions': true,
//       'validateHttpsCertificates': false,
//       'payload': JSON.stringify(jsonDataAttachment)
//     };
//     var responseAttachment = UrlFetchApp.fetch(urlAttachment, options);

//     var resCodeAttachment = responseAttachment.getResponseCode();
//     var resContentAttachment = responseAttachment.getContentText();

//     console.log("response content resCodeAttachment :", resCodeAttachment);
//     console.log("response code resContentAttachment :", resContentAttachment);

//     console.log("res code :", resCode);
//     console.log("Attachments passed");

// }
// else {
//   console.log("No attachments");
// }

  

}

function rejectInvoices(DocType,DocEntry) {

  var sessionId = PropertiesService.getScriptProperties().getProperty('sessionId');
  var sessionTime = PropertiesService.getScriptProperties().getProperty('sessionTime');
  console.log("sessionTime :", sessionTime)

  var currentTime = new Date().getTime();
  if (!sessionId || !sessionTime || (currentTime - sessionTime) > (30 * 60 * 1000)) {
    // Obtain a new session id
    sessionId = loginToSap();

    console.log("New Session ID :", sessionId);
    PropertiesService.getScriptProperties().setProperty('sessionId', sessionId);
    PropertiesService.getScriptProperties().setProperty('sessionTime', currentTime);
  }

  if(DocType=='rSupplier'){
    var url = IP_ADDRESS+'/b1s/v1/PurchaseInvoices('+DocEntry+')/Cancel';

  }

  if(DocType=='rCustomer'){
    var url = IP_ADDRESS+'/b1s/v1/CreditNotes('+DocEntry+')/Cancel';

  }
  
  console.log("url", url);

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Cookie': 'B1SESSION=' + sessionId
    },    
    'muteHttpExceptions': true,
    'validateHttpsCertificates': false
  };
  var response = UrlFetchApp.fetch(url, options);

  var resCode = response.getResponseCode();
  var resContent = response.getContentText();



  // Parse the JSON object
  // var json_data = JSON.parse(resContent);

  console.log("response content :", resContent);
  console.log("response code :", resCode);

  return {
    sapResponseCode : resCode,
    sapContentText: resContent
  };

}


function passToBank(bankType, transactionType, docEntryId) {

//###################################
//###                             ###
//### Must change the BANK port   ###
//###                             ###
//###################################

  //Live
  // var baseUrl =  BANK_IP_ADDRESS+"/transactions";

  //Test
  var baseUrl = BANK_IP_ADDRESS+"/transactions";

  // var apiUrl = baseUrl + "?id=" + id + "&tr=" + tr + "&bank=" + bank;
  

  var payload = {
    bankType: bankType,
    transactionType: transactionType,
    docEntryId: docEntryId
  };

  var options = {
    'method': "post", 
    'contentType': "application/json",
    'muteHttpExceptions': true,
    'validateHttpsCertificates': false,
    'payload': JSON.stringify(payload)
  };

  var response = UrlFetchApp.fetch(baseUrl, options);
  
  Logger.log("Bank Response Code: " + response.getResponseCode());
  Logger.log("Bank Response Content: " + response.getContentText());

  return {
    bankResponseCode : response.getResponseCode(),
    bankContentText: response.getContentText()
  };
}






