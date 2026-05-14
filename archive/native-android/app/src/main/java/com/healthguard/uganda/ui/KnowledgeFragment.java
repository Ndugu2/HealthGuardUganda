package com.healthguard.uganda.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.healthguard.uganda.R;
import com.healthguard.uganda.databinding.FragmentKnowledgeBinding;
import com.healthguard.uganda.db.DatabaseHelper;
import com.healthguard.uganda.db.KnowledgeItem;
import java.util.List;

public class KnowledgeFragment extends Fragment {

    private FragmentKnowledgeBinding binding;
    private DatabaseHelper dbHelper;
    private KnowledgeAdapter adapter;
    private String currentTopic = "all";

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        dbHelper = new DatabaseHelper(requireContext());
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentKnowledgeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // RecyclerView setup
        binding.rvKnowledge.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new KnowledgeAdapter(requireContext());
        binding.rvKnowledge.setAdapter(adapter);

        // Initial load
        refreshList();

        // Search
        binding.etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s.length() > 0) {
                    adapter.setItems(dbHelper.search(s.toString()));
                } else {
                    refreshList();
                }
            }
            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Topic Filter
        binding.chipGroupTopics.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.isEmpty()) return;
            int id = checkedIds.get(0);
            if (id == R.id.chip_all) currentTopic = "all";
            else if (id == R.id.chip_vaccines) currentTopic = "vaccination";
            else if (id == R.id.chip_malaria) currentTopic = "malaria";
            else if (id == R.id.chip_hiv) currentTopic = "hiv";
            else if (id == R.id.chip_maternal) currentTopic = "maternal";
            else if (id == R.id.chip_covid) currentTopic = "covid";
            
            refreshList();
            binding.etSearch.setText("");
        });
    }

    private void refreshList() {
        List<KnowledgeItem> items = dbHelper.getAll(currentTopic);
        adapter.setItems(items);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
