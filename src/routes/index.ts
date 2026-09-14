import { Router } from "express";

import authRoutes from "./auth/auth";
import bookRoutes from "./librarian/book";
import dashboardRoutes from "./librarian/dashboard";
import finePaymentRoutes from "./librarian/fine-payment";
import fineRoutes from "./librarian/fine";
import librarianRoutes from "./librarian/librarian";
import memberRoutes from "./librarian/member";
import shelfRoutes from "./librarian/shelf";
import transactionRoutes from "./librarian/transaction";
import reportRoutes from "./librarian/report";
import libraryRoutes from "./member/library";
import memberDashboardRoutes from "./member/dashboard";
import memberFinePaymentRoutes from "./member/fine-payment";
import memberTransactionRoutes from "./member/transaction";
import profileRoutes from "./profile/profile";
import tripayWebhookRoutes from "./webhook/tripay";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/webhooks/tripay", tripayWebhookRoutes);

router.use("/dashboard", dashboardRoutes);
router.use("/books", bookRoutes);
router.use("/shelves", shelfRoutes);
router.use("/user/librarians", librarianRoutes);
router.use("/user/members", memberRoutes);
router.use("/fine-payments", finePaymentRoutes);
router.use("/fines", fineRoutes);
router.use("/transactions", transactionRoutes);
router.use("/reports", reportRoutes);

router.use("/book", libraryRoutes);
router.use("/member/dashboard", memberDashboardRoutes);
router.use("/member/transactions", memberTransactionRoutes);
router.use("/member/fine-payments", memberFinePaymentRoutes);

router.use("/profile", profileRoutes);

export default router;
