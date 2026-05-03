<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Expense;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialController extends Controller
{
    public function getStats(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $month = $request->query('month', Carbon::now()->month);
        $year = $request->query('year', Carbon::now()->year);

        // 1. Revenue from Bookings
        $revenue = Booking::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereMonth('appointment_at', $month)
            ->whereYear('appointment_at', $year)
            ->sum('price');

        // 2. Expenses
        $expenses = Expense::where('tenant_id', $tenantId)
            ->whereMonth('expense_date', $month)
            ->whereYear('expense_date', $year)
            ->sum('amount');

        // 3. Last Month for Comparison
        $lastMonth = Carbon::create($year, $month, 1)->subMonth();
        $prevRevenue = Booking::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereMonth('appointment_at', $lastMonth->month)
            ->whereYear('appointment_at', $lastMonth->year)
            ->sum('price');

        $prevExpenses = Expense::where('tenant_id', $tenantId)
            ->whereMonth('expense_date', $lastMonth->month)
            ->whereYear('expense_date', $lastMonth->year)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'current_month' => [
                    'revenue' => (float)$revenue,
                    'expenses' => (float)$expenses,
                    'profit' => (float)($revenue - $expenses)
                ],
                'previous_month' => [
                    'revenue' => (float)$prevRevenue,
                    'expenses' => (float)$prevExpenses,
                    'profit' => (float)($prevRevenue - $prevExpenses)
                ],
                'month_name' => Carbon::create($year, $month, 1)->locale('ar')->monthName
            ]
        ]);
    }

    public function getExpenses(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $expenses = Expense::where('tenant_id', $tenantId)
            ->orderBy('expense_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $expenses
        ]);
    }

    public function storeExpense(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $expense = Expense::create([
            'tenant_id' => $request->user()->tenant_id,
            'title' => $request->title,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل المصروف بنجاح',
            'data' => $expense
        ]);
    }

    public function destroyExpense(Request $request, $id)
    {
        $expense = Expense::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المصروف'
        ]);
    }

    public function getTransactions(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // Combine Bookings (In) and Expenses (Out)
        $bookings = Booking::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->select('id', 'price as amount', 'appointment_at as date', DB::raw("'revenue' as type"), 'payment_method as description')
            ->get();

        $expenses = Expense::where('tenant_id', $tenantId)
            ->select('id', 'amount', 'expense_date as date', DB::raw("'expense' as type"), 'title as description')
            ->get();

        $transactions = $bookings->concat($expenses)->sortByDesc('date')->values();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}
