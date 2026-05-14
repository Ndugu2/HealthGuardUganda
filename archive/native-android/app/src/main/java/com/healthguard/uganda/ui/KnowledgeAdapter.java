package com.healthguard.uganda.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.healthguard.uganda.databinding.ItemKnowledgeBinding;
import com.healthguard.uganda.db.KnowledgeItem;
import java.util.ArrayList;
import java.util.List;

public class KnowledgeAdapter extends RecyclerView.Adapter<KnowledgeAdapter.ViewHolder> {

    private final List<KnowledgeItem> items = new ArrayList<>();
    private final Context context;
    private final String lang;

    public KnowledgeAdapter(Context context) {
        this.context = context;
        this.lang = context.getSharedPreferences("HealthGuardPrefs", Context.MODE_PRIVATE)
                .getString("lang", "en");
    }

    public void setItems(List<KnowledgeItem> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemKnowledgeBinding binding = ItemKnowledgeBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        KnowledgeItem item = items.get(position);
        holder.binding.tvItemTopic.setText(item.topic.toUpperCase());
        holder.binding.tvItemMyth.setText(item.mythTextEn != null ? item.mythTextEn : "");
        
        String correctText = lang.equals("lg") ? item.correctTextLg : item.correctTextEn;
        holder.binding.tvItemCorrect.setText(correctText);
        holder.binding.tvItemSource.setText("Source: " + item.source);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ItemKnowledgeBinding binding;
        ViewHolder(ItemKnowledgeBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
