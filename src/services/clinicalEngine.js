/**
 * AI HEALTH RECORDS — Client-Side Clinical Intelligence Engine
 * --------------------------------------------------------------------------
 * Rule-based medical record parser and plain-English explainer.
 * Identifies standard lab values, compares them against established clinical
 * reference ranges, generates structured explanations, compares longitudinal
 * lab shifts, and answers patient health queries grounded strictly in their records.
 *
 * Strict Rule: Never diagnoses or prescribes. Every response includes a clear
 * informational medical disclaimer.
 */
(function (global) {
  'use strict';

  const MEDICAL_DISCLAIMER = 'This explanation is for informational purposes only. Always consult a qualified healthcare professional. Do not make medical decisions or change medication regimens based on this summary.';

  // Standard clinical reference ranges (Adult reference intervals)
  const LAB_DEFINITIONS = [
    {
      id: 'glucose',
      name: 'Fasting Blood Glucose',
      aliases: ['glucose', 'fasting glucose', 'blood sugar', 'fbs', 'fasting blood sugar'],
      unit: 'mg/dL',
      min: 70,
      max: 99,
      regex: /(?:fasting\s+glucose|blood\s+glucose|glucose|blood\s+sugar|fbs)[^\d\n\r:]{0,25}[:=-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
      description: 'Measures the concentration of sugar (glucose) in your bloodstream after an overnight fast; key indicator of metabolic function and insulin activity.',
      highNote: 'Elevated fasting glucose (above 100 mg/dL) may indicate prediabetes or diabetes and warrants dietary review with your doctor.',
      lowNote: 'Low blood sugar (below 70 mg/dL) can lead to shakiness, dizziness, or sweating and should be evaluated.'
    },
    {
      id: 'hba1c',
      name: 'HbA1c (Glycated Hemoglobin)',
      aliases: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'a1c'],
      unit: '%',
      min: 4.0,
      max: 5.6,
      regex: /(?:hba1c|glycated\s+hemoglobin|glycosylated\s+hemoglobin|\ba1c\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*%/i,
      description: 'Measures average blood sugar levels over the past 2 to 3 months by evaluating glucose attached to red blood cell hemoglobin.',
      highNote: 'Levels between 5.7% and 6.4% suggest prediabetes; 6.5% or higher typically indicates diabetes management review.',
      lowNote: 'Values below 4.0% are uncommon and usually evaluated in the context of red blood cell turnover.'
    },
    {
      id: 'hemoglobin',
      name: 'Hemoglobin (Hb)',
      aliases: ['hemoglobin', 'haemoglobin', 'hgb', 'hb'],
      unit: 'g/dL',
      min: 12.0,
      max: 17.5,
      regex: /(?:hemoglobin|haemoglobin|\bhgb\b|\bhb\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:g\/dl|gm\/dl|g\/l)?/i,
      description: 'The iron-rich protein in red blood cells that transports oxygen from your lungs to tissues throughout your body.',
      highNote: 'Elevated hemoglobin can occur with dehydration, smoking, high altitude, or elevated red cell production.',
      lowNote: 'Low hemoglobin is a primary marker of anemia, which frequently causes fatigue, pale skin, or shortness of breath.'
    },
    {
      id: 'cholesterol_total',
      name: 'Total Cholesterol',
      aliases: ['total cholesterol', 'cholesterol, total', 'cholesterol total', 'serum cholesterol'],
      unit: 'mg/dL',
      min: 125,
      max: 200,
      regex: /(?:total\s+cholesterol|cholesterol[,\s]+total|serum\s+cholesterol)[^\d\n\r:]{0,25}[:=-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
      description: 'The total amount of cholesterol circulating in your blood, comprising LDL, HDL, and other lipid components.',
      highNote: 'Total cholesterol above 200 mg/dL can increase the likelihood of arterial plaque build-up over time.',
      lowNote: 'Very low total cholesterol is generally rare and typically assessed alongside liver function and nutrition.'
    },
    {
      id: 'ldl',
      name: 'LDL Cholesterol',
      aliases: ['ldl', 'ldl cholesterol', 'ldl-c', 'low density lipoprotein'],
      unit: 'mg/dL',
      min: 0,
      max: 100,
      regex: /(?:ldl(?:\s+cholesterol)?|ldl-c|low\s+density\s+lipoprotein)[^\d\n\r:]{0,25}[:=-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
      description: 'Often termed "bad cholesterol"; transports cholesterol to cells. Excess LDL can accumulate along artery walls.',
      highNote: 'LDL above 100 mg/dL is a key cardiovascular risk factor; lifestyle modifications or lipid therapy are commonly discussed.',
      lowNote: 'Lower LDL values are generally considered cardio-protective.'
    },
    {
      id: 'hdl',
      name: 'HDL Cholesterol',
      aliases: ['hdl', 'hdl cholesterol', 'hdl-c', 'high density lipoprotein'],
      unit: 'mg/dL',
      min: 40,
      max: 60,
      regex: /(?:hdl(?:\s+cholesterol)?|hdl-c|high\s+density\s+lipoprotein)[^\d\n\r:]{0,25}[:=-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
      description: 'Known as "good cholesterol"; absorbs excess cholesterol from arteries and carries it back to the liver for excretion.',
      highNote: 'Higher HDL levels (above 60 mg/dL) are protective against heart disease.',
      lowNote: 'Low HDL (below 40 mg/dL) reduces protection against arterial plaque and is an independent cardiovascular risk indicator.'
    },
    {
      id: 'triglycerides',
      name: 'Triglycerides',
      aliases: ['triglycerides', 'triglyceride', 'tg'],
      unit: 'mg/dL',
      min: 0,
      max: 150,
      regex: /(?:triglycerides?|\btg\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
      description: 'The most common type of fat in your body; stores excess energy from food in adipose tissue.',
      highNote: 'Elevated triglycerides (above 150 mg/dL) are associated with metabolic syndrome, diabetes risk, and cardiovascular strain.',
      lowNote: 'Low triglycerides are uncommon and typically benign.'
    },
    {
      id: 'creatinine',
      name: 'Serum Creatinine',
      aliases: ['creatinine', 'serum creatinine', 'creat'],
      unit: 'mg/dL',
      min: 0.6,
      max: 1.2,
      regex: /(?:serum\s+creatinine|\bcreatinine\b|\bcreat\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:mg\/dl|umol\/l)?/i,
      description: 'A waste byproduct of normal muscle wear-and-tear filtered exclusively by healthy kidney glomeruli.',
      highNote: 'Elevated creatinine suggests decreased kidney filtration efficiency, dehydration, or strenuous exertion.',
      lowNote: 'Low creatinine is frequently seen in individuals with low muscle mass or reduced protein intake.'
    },
    {
      id: 'bun',
      name: 'Blood Urea Nitrogen (BUN)',
      aliases: ['bun', 'urea', 'blood urea nitrogen'],
      unit: 'mg/dL',
      min: 7,
      max: 20,
      regex: /(?:blood\s+urea\s+nitrogen|\bbun\b|\burea\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:mg\/dl)?/i,
      description: 'Evaluates the amount of urea nitrogen in blood, reflecting protein breakdown and renal excretion efficiency.',
      highNote: 'High BUN can reflect reduced kidney filtration, dehydration, or high dietary protein.',
      lowNote: 'Low BUN is generally uncommon and can appear with severe liver illness or low protein diets.'
    },
    {
      id: 'wbc',
      name: 'White Blood Cell Count (WBC)',
      aliases: ['wbc', 'white blood cells', 'leukocytes', 'total leukocyte count', 'tlc'],
      unit: 'x10³/µL',
      min: 4.0,
      max: 11.0,
      regex: /(?:wbc(?:\s+count)?|white\s+blood\s+cells?|total\s+leukocyte\s+count|\btlc\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:x10\^?3|\/cumm|\/ul|k\/ul)?/i,
      description: 'Cells of the immune system involved in defending the body against infectious diseases and foreign invaders.',
      highNote: 'Elevated WBC (leukocytosis) typically points to active infection, acute inflammation, or physical trauma.',
      lowNote: 'Low WBC (leukopenia) may weaken your immune resistance to viral and bacterial infections.'
    },
    {
      id: 'rbc',
      name: 'Red Blood Cell Count (RBC)',
      aliases: ['rbc', 'red blood cells', 'erythrocytes'],
      unit: 'x10⁶/µL',
      min: 4.2,
      max: 5.9,
      regex: /(?:rbc(?:\s+count)?|red\s+blood\s+cells?|erythrocytes)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:x10\^?6|\/ul|mil\/ul)?/i,
      description: 'The number of cellular oxygen carriers circulating in blood volume.',
      highNote: 'Elevated RBC (erythrocytosis) may stem from dehydration, sleep apnea, or smoking.',
      lowNote: 'Low RBC count suggests anemia or blood volume loss.'
    },
    {
      id: 'platelets',
      name: 'Platelet Count (PLT)',
      aliases: ['platelets', 'platelet count', 'plt'],
      unit: 'x10³/µL',
      min: 150,
      max: 450,
      regex: /(?:platelet(?:s|\s+count)?|\bplt\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:x10\^?3|\/cumm|\/ul|k\/ul)?/i,
      description: 'Cell fragments that clump together to initiate blood clotting and arrest hemorrhage.',
      highNote: 'High platelets (thrombocytosis) can occur in response to systemic inflammation, iron deficiency, or infection.',
      lowNote: 'Low platelets (thrombocytopenia) elevate the potential for easy bruising or extended bleeding.'
    },
    {
      id: 'blood_pressure',
      name: 'Blood Pressure',
      aliases: ['blood pressure', 'bp'],
      unit: 'mmHg',
      min: 90,
      max: 120, // systolic benchmark
      regex: /(?:blood\s+pressure|\bbp\b)[^\d\n\r:]{0,20}[:=-]?\s*(\d{2,3})\s*[\/x]\s*(\d{2,3})\s*(?:mm\s*hg)?/i,
      isDual: true,
      description: 'The mechanical lateral pressure exerted by circulating blood upon arterial walls during heart contraction and relaxation.',
      highNote: 'Elevated blood pressure (hypertension, >120/80 mmHg) increases systemic cardiac workload and vascular resistance.',
      lowNote: 'Low blood pressure (hypotension, <90/60 mmHg) may trigger postural dizziness or fainting.'
    },
    {
      id: 'heart_rate',
      name: 'Heart Rate / Pulse',
      aliases: ['heart rate', 'pulse', 'pulse rate', 'bpm'],
      unit: 'bpm',
      min: 60,
      max: 100,
      regex: /(?:heart\s+rate|pulse(?:\s+rate)?|\bbpm\b)[^\d\n\r:]{0,20}[:=-]?\s*(\d{2,3})\s*(?:bpm)?/i,
      description: 'The rhythmic count of ventricular contractions per minute at rest.',
      highNote: 'Resting pulse above 100 bpm (tachycardia) can be provoked by fever, caffeine, dehydration, stress, or cardiac conditions.',
      lowNote: 'Resting pulse below 60 bpm (bradycardia) is common in trained athletes or may reflect conduction system slowing.'
    },
    {
      id: 'tsh',
      name: 'TSH (Thyroid Stimulating Hormone)',
      aliases: ['tsh', 'thyroid stimulating hormone'],
      unit: 'µIU/mL',
      min: 0.4,
      max: 4.0,
      regex: /(?:thyroid\s+stimulating\s+hormone|\btsh\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:u?iu\/ml)?/i,
      description: 'A pituitary hormone regulating synthesis and secretion of thyroid hormones (T3, T4).',
      highNote: 'Elevated TSH suggests underactive thyroid (hypothyroidism), often causing sluggishness or cold sensitivity.',
      lowNote: 'Suppressed TSH indicates thyroid overactivity (hyperthyroidism), which can trigger tremor, weight loss, or palpitations.'
    },
    {
      id: 'alt',
      name: 'ALT (Alanine Aminotransferase)',
      aliases: ['alt', 'sgpt', 'alanine aminotransferase'],
      unit: 'U/L',
      min: 7,
      max: 56,
      regex: /(?:alanine\s+aminotransferase|\balt\b|\bsgpt\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:u\/l)?/i,
      description: 'An intracellular enzyme concentrated primarily in hepatocyte cytoplasm.',
      highNote: 'Elevated ALT points toward hepatocellular inflammation, fatty liver, or medication toxicity.',
      lowNote: 'Low ALT is a physiological baseline finding with no negative clinical consequence.'
    },
    {
      id: 'ast',
      name: 'AST (Aspartate Aminotransferase)',
      aliases: ['ast', 'sgot', 'aspartate aminotransferase'],
      unit: 'U/L',
      min: 10,
      max: 40,
      regex: /(?:aspartate\s+aminotransferase|\bast\b|\bsgot\b)[^\d\n\r:]{0,25}[:=-]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:u\/l)?/i,
      description: 'An enzyme present in liver tissue, heart muscle, skeletal muscle, and red blood cells.',
      highNote: 'Elevated AST reflects tissue cellular damage in liver or muscle.',
      lowNote: 'Low AST is physiologically normal.'
    }
  ];

  /**
   * Scans text and extracts clinical biomarker measurements
   */
  function extractBiomarkers(text) {
    if (!text || typeof text !== 'string') return [];
    const found = [];
    const seenIds = new Set();

    LAB_DEFINITIONS.forEach((def) => {
      const match = text.match(def.regex);
      if (match && !seenIds.has(def.id)) {
        seenIds.add(def.id);
        if (def.isDual) {
          const sys = parseFloat(match[1]);
          const dia = parseFloat(match[2]);
          let status = 'Normal';
          let note = 'Within standard adult resting blood pressure range.';
          if (sys > 130 || dia > 80) {
            status = 'High';
            note = def.highNote;
          } else if (sys < 90 || dia < 60) {
            status = 'Low';
            note = def.lowNote;
          }
          found.push({
            id: def.id,
            name: def.name,
            value: sys + '/' + dia,
            numericValue: sys,
            unit: def.unit,
            referenceRange: '90-120 / 60-80 ' + def.unit,
            status: status,
            description: def.description,
            interpretation: note
          });
        } else {
          const num = parseFloat(match[1]);
          if (!isNaN(num)) {
            let status = 'Normal';
            let note = 'Within normal healthy reference limits.';
            if (num > def.max) {
              status = 'High';
              note = def.highNote;
            } else if (num < def.min) {
              status = 'Low';
              note = def.lowNote;
            }
            found.push({
              id: def.id,
              name: def.name,
              value: String(num),
              numericValue: num,
              unit: def.unit,
              referenceRange: def.min + ' - ' + def.max + ' ' + def.unit,
              status: status,
              description: def.description,
              interpretation: note
            });
          }
        }
      }
    });

    return found;
  }

  /**
   * Analyzes an uploaded clinical document and generates an educational breakdown
   */
  function analyzeReportText(text, category, reportTitle) {
    const rawText = (text || '').trim();
    const markers = extractBiomarkers(rawText);

    // Case 1: Scanned PDF or no text extracted
    if (!rawText || rawText.length < 25) {
      return {
        overview: 'Document Archived (Scanned / Image Document)',
        simpleExplanation: [
          'This PDF appears to be a scanned paper document or contains no extractable digital text layer.',
          'The original file has been securely stored in your personal health records vault so you can open, preview, or present it to your physician during appointments.',
          'If this report contains specific test values you want explained, you can review the physical sheet with your care team or ask the AI Assistant.'
        ],
        markers: [],
        disclaimer: MEDICAL_DISCLAIMER
      };
    }

    // Case 2: Biomarkers identified in digital text
    if (markers.length > 0) {
      const highMarkers = markers.filter((m) => m.status === 'High');
      const lowMarkers = markers.filter((m) => m.status === 'Low');
      const normalMarkers = markers.filter((m) => m.status === 'Normal');

      let overview = 'Clinical analysis completed. ' + markers.length + ' biomarker' + (markers.length > 1 ? 's' : '') + ' identified; ';
      if (highMarkers.length === 0 && lowMarkers.length === 0) {
        overview += 'all values are within standard clinical reference ranges.';
      } else {
        const flaggedCount = highMarkers.length + lowMarkers.length;
        overview += flaggedCount + ' value' + (flaggedCount > 1 ? 's are' : ' is') + ' flagged outside reference thresholds.';
      }

      const paragraphs = [];

      // Flagged findings
      if (highMarkers.length > 0) {
        paragraphs.push(
          '**Higher than standard range:** ' +
          highMarkers.map((m) => m.name + ' (' + m.value + ' ' + m.unit + ')').join(', ') + '. ' +
          highMarkers.map((m) => m.name + ': ' + m.interpretation).join(' ')
        );
      }

      if (lowMarkers.length > 0) {
        paragraphs.push(
          '**Lower than standard range:** ' +
          lowMarkers.map((m) => m.name + ' (' + m.value + ' ' + m.unit + ')').join(', ') + '. ' +
          lowMarkers.map((m) => m.name + ': ' + m.interpretation).join(' ')
        );
      }

      // Normal findings
      if (normalMarkers.length > 0) {
        paragraphs.push(
          '**Within expected normal ranges:** ' +
          normalMarkers.map((m) => m.name + ' (' + m.value + ' ' + m.unit + ')').join(', ') + '. ' +
          'These measurements indicate normal physiologic balance for these parameters at the time of testing.'
        );
      }

      // What the patient should do next
      paragraphs.push(
        '**Understanding Laboratory Context:** Laboratory reference intervals can vary slightly depending on the specific equipment and methodology used by your testing center. Discuss these results alongside your clinical history and symptoms with your doctor.'
      );

      return {
        overview: overview,
        simpleExplanation: paragraphs,
        markers: markers,
        disclaimer: MEDICAL_DISCLAIMER
      };
    }

    // Case 3: Digital clinical report without standard lab numbers (e.g. imaging, narrative, consultation)
    const cleanSample = rawText.slice(0, 500).replace(/\s+/g, ' ');
    const paragraphs = [
      'This clinical document contains digital narrative text. No standard numeric blood/metabolic biomarker values (such as glucose or hemoglobin) were explicitly identified in the text.',
      '**Document Preview & Context:** ' + cleanSample + (rawText.length > 500 ? '...' : ''),
      'The file has been indexed in your personal vault under **' + (category || 'Clinical Record') + '**. You can review the full PDF with your doctor or ask the AI Health Assistant questions about specific passages.'
    ];

    return {
      overview: (category || 'Clinical') + ' Document Indexed: ' + (reportTitle || 'Medical Record'),
      simpleExplanation: paragraphs,
      markers: [],
      disclaimer: MEDICAL_DISCLAIMER
    };
  }

  /**
   * Compares two selected reports and describes numeric shifts
   */
  function compareTwoReports(reportA, reportB) {
    if (!reportA || !reportB) {
      return {
        comparison: 'Please select two valid medical reports to compare.\n\n' + MEDICAL_DISCLAIMER
      };
    }

    const markersA = extractBiomarkers(reportA.extractedText || reportA.title || '');
    const markersB = extractBiomarkers(reportB.extractedText || reportB.title || '');

    const mapA = {};
    markersA.forEach((m) => { mapA[m.id] = m; });
    const mapB = {};
    markersB.forEach((m) => { mapB[m.id] = m; });

    const allKeys = Array.from(new Set([...Object.keys(mapA), ...Object.keys(mapB)]));

    if (allKeys.length === 0) {
      const summary = [
        '### Report Comparison Overview',
        '**Report A:** ' + (reportA.title || 'Report 1') + ' (' + (reportA.date || 'N/A') + ')',
        '**Report B:** ' + (reportB.title || 'Report 2') + ' (' + (reportB.date || 'N/A') + ')',
        '',
        'Neither document contained standard numerical biomarkers that can be matched on a shared clinical scale. Both records are stored in your health vault for review with your physician.',
        '',
        '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
      ].join('\n');
      return { comparison: summary };
    }

    const rows = [];
    const narratives = [];

    allKeys.forEach((key) => {
      const a = mapA[key];
      const b = mapB[key];
      const name = (b && b.name) || (a && a.name) || key;
      const unit = (b && b.unit) || (a && a.unit) || '';

      if (a && b) {
        let trend = 'Stable';
        let changeText = 'No significant shift';
        if (typeof a.numericValue === 'number' && typeof b.numericValue === 'number') {
          const diff = Math.round((b.numericValue - a.numericValue) * 100) / 100;
          if (diff > 0) {
            trend = 'Increased (↑)';
            changeText = '+' + diff + ' ' + unit;
          } else if (diff < 0) {
            trend = 'Decreased (↓)';
            changeText = diff + ' ' + unit;
          }
        }

        rows.push({
          name: name,
          valA: a.value + ' ' + unit + ' (' + a.status + ')',
          valB: b.value + ' ' + unit + ' (' + b.status + ')',
          shift: trend + ' ' + changeText
        });

        narratives.push(
          '- **' + name + '**: Shifted from ' + a.value + ' ' + unit + ' on ' + reportA.date +
          ' to ' + b.value + ' ' + unit + ' on ' + reportB.date + ' (' + trend + '). ' +
          'Status moved from ' + a.status + ' to ' + b.status + '.'
        );
      } else if (a && !b) {
        rows.push({
          name: name,
          valA: a.value + ' ' + unit + ' (' + a.status + ')',
          valB: 'Not measured',
          shift: 'Measured only in first report'
        });
      } else if (!a && b) {
        rows.push({
          name: name,
          valA: 'Not measured',
          valB: b.value + ' ' + unit + ' (' + b.status + ')',
          shift: 'New parameter in second report'
        });
      }
    });

    const lines = [
      '### Comparative Laboratory Trend Analysis',
      '**Earlier Test:** ' + (reportA.title || 'Report A') + ' (' + (reportA.date || 'Date N/A') + ')',
      '**Follow-Up Test:** ' + (reportB.title || 'Report B') + ' (' + (reportB.date || 'Date N/A') + ')',
      '',
      '#### Key Observed Shifts:',
      ...narratives,
      '',
      '#### Plain-English Guidance:',
      'Biomarkers fluctuate based on diet, hydration, physical exertion, time of day, and medication compliance. Bring these trend comparisons to your follow-up doctor appointment to discuss whether adjustments to lifestyle or medications are warranted.',
      '',
      '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
    ];

    return {
      comparison: lines.join('\n')
    };
  }

  /**
   * Answers patient questions grounded strictly in their saved health records
   */
  function answerHealthQuestion(question, contextData) {
    const q = (question || '').trim();
    if (!q) {
      return { reply: 'Please enter a health or records question.' };
    }

    const lower = q.toLowerCase();

    // Strict safety check: Refuse clinical diagnosis and prescribing
    const diagnosisKeywords = [
      'diagnose', 'do i have', 'what disease', 'am i sick', 'what illness',
      'prescribe', 'what medicine should i take', 'what pills should i take',
      'how to cure', 'how to treat my', 'cure my'
    ];
    const isSeekingDiagnosisOrPrescription = diagnosisKeywords.some((kw) => lower.includes(kw));

    if (isSeekingDiagnosisOrPrescription) {
      return {
        reply: [
          '**Important Medical Guidance:**',
          'As an educational health records assistant, I am programmed to strictly provide information and cannot diagnose illnesses, evaluate symptoms, or prescribe medication treatments.',
          '',
          'Please contact your physician, general practitioner, or urgent care clinic directly so a licensed healthcare professional can examine you and provide medical advice.',
          '',
          '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        ].join('\n')
      };
    }

    // Context aggregation
    const userProfile = (contextData && contextData.profile) || {};
    const reminders = (contextData && contextData.reminders) || [];
    const reports = (contextData && contextData.reports) || [];
    const allergies = userProfile.allergies || [];

    // Query 1: Medications / Pills
    if (lower.includes('medication') || lower.includes('medicine') || lower.includes('pill') || lower.includes('dose') || lower.includes('reminder')) {
      if (reminders.length === 0) {
        return {
          reply: 'You currently have no active medication reminders scheduled in your personal vault. You can add your daily schedule from the **Medicine Reminders** page.\n\n*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        };
      }
      const list = reminders.map((m) =>
        '- **' + m.name + '** (' + (m.dosage || 'Standard dose') + '): Scheduled for **' + m.period + '** at ' + (m.time || 'scheduled time') + ' (' + (m.mealInstruction || 'As directed') + '). ' +
        (m.takenToday ? '✓ *Taken today*' : '○ *Pending today*')
      ).join('\n');

      return {
        reply: [
          'Here is your current active medication schedule saved in your health vault:',
          '',
          list,
          '',
          'Always follow the exact prescription label instructions provided by your pharmacist or doctor.',
          '',
          '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        ].join('\n')
      };
    }

    // Query 2: Allergies
    if (lower.includes('allerg')) {
      const allergyText = allergies.length > 0 ? allergies.join(', ') : 'No known drug or food allergies recorded';
      return {
        reply: [
          '**Recorded Allergies in Your Profile:**',
          '• ' + allergyText,
          '',
          'You can add or update your allergy tags anytime in **My Profile**.',
          '',
          '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        ].join('\n')
      };
    }

    // Query 3: Specific Biomarkers (Glucose, Cholesterol, Hemoglobin, Creatinine, etc.)
    const matchedDef = LAB_DEFINITIONS.find((def) =>
      def.aliases.some((alias) => lower.includes(alias))
    );

    if (matchedDef) {
      // Look for this biomarker across saved reports
      const foundInReports = [];
      reports.forEach((r) => {
        const text = r.extractedText || r.title || '';
        const match = text.match(matchedDef.regex);
        if (match) {
          foundInReports.push({
            reportTitle: r.title || r.fileName,
            date: r.date,
            value: match[1],
            unit: matchedDef.unit
          });
        }
      });

      let reportFindingText = '';
      if (foundInReports.length > 0) {
        reportFindingText = [
          '**Recorded in Your Uploaded Vault:**',
          ...foundInReports.map((item) => '- **' + item.date + '** (' + item.reportTitle + '): ' + item.value + ' ' + item.unit)
        ].join('\n');
      } else {
        reportFindingText = 'I checked your archived reports, and no recorded measurement for **' + matchedDef.name + '** was detected in your digital lab files.';
      }

      return {
        reply: [
          '### About ' + matchedDef.name + ':',
          matchedDef.description,
          '',
          '**Standard Reference Range:** ' + matchedDef.min + ' - ' + matchedDef.max + ' ' + matchedDef.unit,
          '',
          reportFindingText,
          '',
          '**Clinical Meaning:**',
          '• ' + matchedDef.highNote,
          '• ' + matchedDef.lowNote,
          '',
          '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        ].join('\n')
      };
    }

    // Query 4: Summary of recent reports
    if (lower.includes('report') || lower.includes('result') || lower.includes('latest') || lower.includes('summary')) {
      if (reports.length === 0) {
        return {
          reply: 'You have not uploaded any medical reports yet. Go to **Upload Report** to add your first PDF test result or visit summary.\n\n*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        };
      }
      const latest = reports[0];
      const summaryText = latest.aiExplanation
        ? (latest.aiExplanation.overview + '\n\n' + (latest.aiExplanation.simpleExplanation || []).join('\n\n'))
        : (latest.extractedText ? latest.extractedText.slice(0, 300) + '...' : 'Report archived in vault.');

      return {
        reply: [
          '### Latest Report in Your Vault: ' + (latest.title || latest.fileName),
          '**Date:** ' + latest.date + ' | **Facility:** ' + latest.hospital + ' | **Category:** ' + latest.category,
          '',
          summaryText,
          '',
          'You can review all measurements by clicking **Explain with AI** in **My Health Records**.',
          '',
          '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
        ].join('\n')
      };
    }

    // Default Fallback
    return {
      reply: [
        'I am your personal AI Health Records assistant. I can help you understand your uploaded reports, active medication reminders, recorded allergies, and laboratory reference ranges.',
        '',
        '**Questions you can ask:**',
        '• "What are my active medication reminders?"',
        '• "What were my latest blood test results?"',
        '• "Explain what HbA1c or fasting glucose means"',
        '• "What allergies are recorded on my file?"',
        '',
        '*(Note: ' + MEDICAL_DISCLAIMER + ')*'
      ].join('\n')
    };
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.clinicalEngine = {
    extractBiomarkers,
    analyzeReportText,
    compareTwoReports,
    answerHealthQuestion,
    definitions: LAB_DEFINITIONS,
    disclaimer: MEDICAL_DISCLAIMER
  };
})(window);
