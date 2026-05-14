package com.healthguard.uganda.ui;

import android.content.Context;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import com.healthguard.uganda.R;
import com.healthguard.uganda.ai.ClassificationResult;
import com.healthguard.uganda.ai.HybridClassifier;
import com.healthguard.uganda.databinding.FragmentAnalyzeBinding;
import com.healthguard.uganda.db.ClaimRecord;
import com.healthguard.uganda.db.DatabaseHelper;
import com.healthguard.uganda.db.KnowledgeItem;
import java.util.Locale;

public class AnalyzeFragment extends Fragment implements TextToSpeech.OnInitListener {

    private FragmentAnalyzeBinding binding;
    private HybridClassifier classifier;
    private DatabaseHelper dbHelper;
    private TextToSpeech tts;
    private ClassificationResult lastResult;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        classifier = new HybridClassifier(requireContext());
        dbHelper = new DatabaseHelper(requireContext());
        tts = new TextToSpeech(requireContext(), this);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentAnalyzeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        binding.btnVerify.setOnClickListener(v -> performAnalysis());
        
        binding.btnSaveEncounter.setOnClickListener(v -> saveEncounter());
        
        binding.btnTts.setOnClickListener(v -> speakResult());
        
        binding.btnFlag.setOnClickListener(v -> {
            Toast.makeText(requireContext(), R.string.myth_flagged, Toast.LENGTH_SHORT).show();
        });
    }

    private void performAnalysis() {
        String claim = binding.etClaim.getText().toString().trim();
        if (claim.isEmpty()) {
            binding.til_claim.setError("Please enter a claim");
            return;
        }
        binding.til_claim.setError(null);

        // Analyze
        lastResult = classifier.classify(claim);
        displayResult(lastResult);
    }

    private void displayResult(ClassificationResult result) {
        binding.layoutResults.setVisibility(View.VISIBLE);

        // Label and Colors
        int color;
        String labelText;
        switch (result.getLabel()) {
            case ACCURATE:
                color = ContextCompat.getColor(requireContext(), R.color.label_accurate);
                labelText = getString(R.string.result_accurate);
                binding.cardStatus.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.card_accurate_bg));
                break;
            case INACCURATE:
                color = ContextCompat.getColor(requireContext(), R.color.label_inaccurate);
                labelText = getString(R.string.result_inaccurate);
                binding.cardStatus.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.card_inaccurate_bg));
                break;
            default:
                color = ContextCompat.getColor(requireContext(), R.color.label_uncertain);
                labelText = getString(R.string.result_uncertain);
                binding.cardStatus.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.card_uncertain_bg));
                break;
        }

        binding.tvResultLabel.setText(labelText);
        binding.tvResultLabel.setTextColor(color);
        
        // Confidence
        binding.progressConfidence.setProgress(result.getConfidencePct());
        binding.progressConfidence.getProgressDrawable().setTint(color);
        binding.tvConfidenceValue.setText(result.getConfidencePct() + "%");
        binding.tvConfidenceValue.setTextColor(color);

        // Detection Method
        binding.tvDetectionSource.setText(result.isFromRule() ? 
                getString(R.string.result_from_rule) : getString(R.string.result_from_ai));

        // Correct Information
        String currentLang = requireActivity().getSharedPreferences("HealthGuardPrefs", Context.MODE_PRIVATE)
                .getString("lang", "en");
        
        KnowledgeItem item = dbHelper.getResponseForKeyword(result.getTriggerKeyword());
        if (item != null) {
            String info = currentLang.equals("lg") ? item.correctTextLg : item.correctTextEn;
            binding.tvCorrectInfo.setText(info);
            binding.tvSource.setText(getString(R.string.result_source) + " " + item.source);
        } else {
            binding.tvCorrectInfo.setText("No specific information found in the local database for this claim. Please consult a district health officer.");
            binding.tvSource.setText("");
        }
    }

    private void saveEncounter() {
        if (lastResult == null) return;
        
        String claim = binding.etClaim.getText().toString().trim();
        ClaimRecord record = new ClaimRecord(claim, lastResult.getLabel().name(), 
                lastResult.getConfidencePct(), "Buwambo Village");
        
        dbHelper.insertClaim(record);
        Toast.makeText(requireContext(), R.string.encounter_saved, Toast.LENGTH_SHORT).show();
    }

    private void speakResult() {
        String text = binding.tvCorrectInfo.getText().toString();
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ResultTTS");
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            String currentLang = requireActivity().getSharedPreferences("HealthGuardPrefs", Context.MODE_PRIVATE)
                    .getString("lang", "en");
            int result = tts.setLanguage(new Locale(currentLang));
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts.setLanguage(Locale.ENGLISH);
            }
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (classifier != null) {
            classifier.close();
        }
        super.onDestroy();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
