package com.healthguard.uganda.ui;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.healthguard.uganda.R;
import com.healthguard.uganda.databinding.ItemReportBinding;
import com.healthguard.uganda.db.ClaimRecord;
import java.util.ArrayList;
import java.util.List;

public class ReportAdapter extends RecyclerView.Adapter<ReportAdapter.ViewHolder> {

    private final List<ClaimRecord> items = new ArrayList<>();

    public void setItems(List<ClaimRecord> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemReportBinding binding = ItemReportBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ClaimRecord record = items.get(position);
        holder.binding.tvReportClaim.setText(record.claimText);
        holder.binding.tvReportDate.setText(record.submittedAt);
        holder.binding.tvReportLabel.setText(record.label);
        holder.binding.tvReportConfidence.setText("Confidence: " + record.confidencePct + "%");

        // Label Color
        int color;
        if (record.label.equals("ACCURATE")) {
            color = ContextCompat.getColor(holder.itemView.getContext(), R.color.label_accurate);
        } else if (record.label.equals("INACCURATE")) {
            color = ContextCompat.getColor(holder.itemView.getContext(), R.color.label_inaccurate);
        } else {
            color = ContextCompat.getColor(holder.itemView.getContext(), R.color.label_uncertain);
        }
        holder.binding.tvReportLabel.setBackgroundColor(color);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ItemReportBinding binding;
        ViewHolder(ItemReportBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
