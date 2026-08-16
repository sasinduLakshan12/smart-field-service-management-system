const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const WorkOrder = require('../models/WorkOrder');
const Company = require('../models/Company');
const Customer = require('../models/Customer');

// @desc    Generate Invoice for a completed Work Order
// @route   POST /api/v1/billing/invoices
// @access  Private (Admin/Dispatcher)
exports.generateInvoice = async (req, res, next) => {
  try {
    const { workOrderId, discount } = req.body;

    const workOrder = await WorkOrder.findOne({ _id: workOrderId, companyId: req.user.companyId }).populate('serviceId');
    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }

    if (workOrder.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Invoice can only be generated for completed jobs' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ workOrderId });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: 'Invoice has already been generated for this work order' });
    }

    // Fetch company billing settings
    const company = await Company.findById(req.user.companyId);
    const taxRate = company?.settings?.taxRate || 0;

    // Assemble invoice items
    const items = [];
    
    // 1. Add base service charge
    items.push({
      description: `Base Service: ${workOrder.serviceId.name}`,
      quantity: 1,
      unitPrice: workOrder.serviceId.price,
      amount: workOrder.serviceId.price
    });

    // 2. Add labor charges
    if (workOrder.laborCost > 0) {
      items.push({
        description: 'Labor Charges',
        quantity: 1,
        unitPrice: workOrder.laborCost,
        amount: workOrder.laborCost
      });
    }

    // 3. Add inventory parts used
    workOrder.parts.forEach(part => {
      items.push({
        description: `Part: ${part.name}`,
        quantity: part.quantity,
        unitPrice: part.price,
        amount: part.quantity * part.price
      });
    });

    // Calculate billing aggregates
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = parseFloat(((subTotal * taxRate) / 100).toFixed(2));
    const discountAmount = discount || 0;
    const totalAmount = parseFloat((subTotal + taxAmount - discountAmount).toFixed(2));

    // Auto-generate invoice number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randDigits}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      companyId: req.user.companyId,
      workOrderId,
      customerId: workOrder.customerId,
      items,
      subTotal,
      taxRate,
      taxAmount,
      discount: discountAmount,
      totalAmount,
      status: 'Issued',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days due
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/v1/billing/invoices
// @access  Private (Admin sees all, Customer sees own)
exports.getInvoices = async (req, res, next) => {
  try {
    const filter = { ...req.tenantFilter };

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!customer) return res.status(200).json({ success: true, data: [] });
      filter.customerId = customer._id;
    }

    const invoices = await Invoice.find(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('workOrderId', 'notes')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice details
// @route   GET /api/v1/billing/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!customer) return res.status(403).json({ success: false, message: 'Access denied' });
      filter.customerId = customer._id;
    }

    const invoice = await Invoice.findOne(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('workOrderId', 'notes');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice details retrieved',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a payment against an invoice
// @route   POST /api/v1/billing/payments
// @access  Private (Admin/Dispatcher/Customer paying)
exports.recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, transactionReference } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, companyId: req.user.companyId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
    }

    // Create Payment record
    const payment = await Payment.create({
      invoiceId,
      companyId: req.user.companyId,
      amount,
      paymentMethod,
      transactionReference,
      status: 'Completed'
    });

    // Sum all completed payments for this invoice
    const allPayments = await Payment.find({ invoiceId, status: 'Completed' });
    const totalPaid = allPayments.reduce((sum, pay) => sum + pay.amount, 0);

    // Update invoice payment status
    if (totalPaid >= invoice.totalAmount) {
      invoice.status = 'Paid';
    } else if (totalPaid > 0) {
      invoice.status = 'Partially Paid';
    }
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded and ledger updated successfully',
      data: {
        payment,
        invoiceStatus: invoice.status,
        outstandingAmount: Math.max(0, parseFloat((invoice.totalAmount - totalPaid).toFixed(2)))
      }
    });
  } catch (error) {
    next(error);
  }
};
