package com.healthguard.uganda.ui;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.healthguard.uganda.R;
import com.healthguard.uganda.databinding.FragmentHomeBinding;
import java.util.Locale;

public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private SharedPreferences prefs;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = requireActivity().getSharedPreferences("HealthGuardPrefs", Context.MODE_PRIVATE);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Navigation
        binding.btnAnalyze.setOnClickListener(v -> 
            Navigation.findNavController(v).navigate(R.id.analyzeFragment));
        
        binding.btnKnowledge.setOnClickListener(v -> 
            Navigation.findNavController(v).navigate(R.id.knowledgeFragment));
        
        binding.btnReports.setOnClickListener(v -> 
            Navigation.findNavController(v).navigate(R.id.reportsFragment));

        // Language Toggle Logic
        String currentLang = prefs.getString("lang", "en");
        if (currentLang.equals("lg")) {
            binding.langToggleGroup.check(R.id.btn_lang_lg);
        } else {
            binding.langToggleGroup.check(R.id.btn_lang_en);
        }

        binding.langToggleGroup.addOnButtonCheckedListener((group, checkedId, isChecked) -> {
            if (isChecked) {
                String newLang = (checkedId == R.id.btn_lang_lg) ? "lg" : "en";
                if (!newLang.equals(prefs.getString("lang", "en"))) {
                    updateLanguage(newLang);
                }
            }
        });
    }

    private void updateLanguage(String lang) {
        prefs.edit().putString("lang", lang).apply();
        
        // Update Locale
        Locale locale = new Locale(lang);
        Locale.setDefault(locale);
        Resources resources = getResources();
        Configuration config = resources.getConfiguration();
        config.setLocale(locale);
        resources.updateConfiguration(config, resources.getDisplayMetrics());
        
        // Restart activity to apply changes
        requireActivity().recreate();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
