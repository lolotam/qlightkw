

# Add Bulk Delete to Admin Products

## Changes

**File: `src/pages/admin/Products.tsx`**

1. Add `selectedIds` state (`Set<string>`) and a `bulkDeleteDialogOpen` state
2. Add a checkbox column header with "select all" toggle
3. Add a checkbox in each row to select/deselect individual products
4. Show a bulk action bar (above the table) when any products are selected, displaying count and a "Delete Selected" button
5. Add a `bulkDeleteMutation` that deletes all selected product IDs via `supabase.from('products').delete().in('id', [...selectedIds])`
6. Add a second `AlertDialog` for bulk delete confirmation showing the count of selected products
7. Clear selection after successful bulk delete
8. Also fix the duplicate `{t('admin.delete', 'Delete')}` on line 418

