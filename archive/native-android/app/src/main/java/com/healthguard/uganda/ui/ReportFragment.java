package com.healthguard.uganda.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.IndexValueFormatter;
import com.healthguard.uganda.R;
import com.healthguard.uganda.databinding.FragmentReportsBinding;
import com.healthguard.uganda.db.ClaimRecord;
import com.healthguard.uganda.db.DatabaseHelper;
import java.util.ArrayList;
import java.util.List;

public class ReportFragment extends Fragment {

    private FragmentReportsBinding binding;
    private DatabaseHelper dbHelper;
    private ReportAdapter adapter;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        dbHelper = new DatabaseHelper(requireContext());
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentReportsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Stats & Chart
        updateStatsAndChart();

        // RecyclerView
        binding.rvReports.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ReportAdapter();
        binding.rvReports.setAdapter(adapter);

        List<ClaimRecord> claims = dbHelper.getAllClaims();
        if (claims.isEmpty()) {
            binding.tvReportsEmpty.setVisibility(View.VISIBLE);
            binding.rvReports.setVisibility(View.GONE);
        } else {
            binding.tvReportsEmpty.setVisibility(View.GONE);
            binding.rvReports.setVisibility(View.VISIBLE);
            adapter.setItems(claims);
        }
    }

    private void updateStatsAndChart() {
        int accurate = dbHelper.countByLabel("ACCURATE");
        int misinfo = dbHelper.countByLabel("INACCURATE");
        int uncertain = dbHelper.countByLabel("UNCERTAIN");
        int total = accurate + misinfo + uncertain;

        binding.tvStatTotal.setText(String.valueOf(total));
        binding.tvStatAccurate.setText(String.valueOf(accurate));
        binding.tvStatMisinfo.setText(String.valueOf(misinfo));

        // Setup Chart
        setupChart(accurate, misinfo, uncertain);
    }

    private void setupChart(int accurate, int misinfo, int uncertain) {
        List<BarEntry> entries = new ArrayList<>();
        entries.add(new BarEntry(0, accurate));
        entries.add(new BarEntry(1, misinfo));
        entries.add(new BarEntry(2, uncertain));

        BarDataSet dataSet = new BarDataSet(entries, "Encounter Breakdown");
        dataSet.setColors(new int[]{
                ContextCompat.getColor(requireContext(), R.color.label_accurate),
                ContextCompat.getColor(requireContext(), R.color.label_inaccurate),
                ContextCompat.getColor(requireContext(), R.color.label_uncertain)
        });
        dataSet.setValueTextSize(10f);

        BarData barData = new BarData(dataSet);
        binding.barChart.setData(barData);

        // Styling
        binding.barChart.getDescription().setEnabled(false);
        binding.barChart.getLegend().setEnabled(false);
        binding.barChart.getAxisRight().setEnabled(false);
        binding.barChart.getAxisLeft().setDrawGridLines(false);
        
        XAxis xAxis = binding.barChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new IndexValueFormatter(new String[]{"Accurate", "Misinfo", "Uncertain"}));

        binding.barChart.invalidate(); // Refresh
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
