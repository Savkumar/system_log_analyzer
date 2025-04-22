# ARL Level Traffic Pattern Enhancement Plan

## Overview
Enhance the ARL Level Traffic Pattern section by integrating Combined Traffic Analysis functionality with ARL selection capabilities to enable detailed comparison between overall and ARL-specific traffic patterns.

## Component Structure

### Enhanced ARL Traffic Analysis Component
```typescript
interface EnhancedARLAnalysisProps {
  arlRPMData: ARLData[];
  arlRPSData: ARLData[];
  overallRPMData: RPMData[];
  overallRPSData: RPSData[];
  metrics: TrafficMetrics;
  loading: boolean;
  error: string | null;
}
```

## Key Features

### 1. ARL Selection
- Dropdown/buttons to select specific ARL IDs for analysis
- Support for comparing selected ARL traffic with overall traffic
- Clear visual distinction between overall and ARL-specific metrics

### 2. Traffic Visualization
- Combined view showing overlap between overall RPM and selected ARL RPM
- Synchronized time axis for accurate comparison
- Interactive tooltips showing both overall and ARL-specific values
- Clear color coding to distinguish between overall and ARL traffic

### 3. Time Range Controls
- Reuse existing time range filter functionality
- Apply time filtering consistently across all visualizations
- Support for standard time ranges (5s, 10s, 15s, 30s, 1m, etc.)

### 4. Analysis Features
- Display key metrics for both overall and selected ARL traffic
- Highlight significant differences between overall and ARL patterns
- Calculate and show correlation between overall and ARL traffic

## Implementation Steps

1. **Component Integration**
   - Move CombinedTrafficAnalysis under ARL Level Traffic Pattern section
   - Add ARL selection controls
   - Integrate time range filtering

2. **Data Flow**
   - Filter data based on selected ARL ID
   - Process overall and ARL-specific data for comparison
   - Apply time range filtering to both datasets

3. **UI Updates**
   - Add ARL selection interface
   - Update visualization layout to show combined analysis
   - Implement synchronized controls

4. **Analysis Features**
   - Add metrics comparison
   - Implement pattern analysis
   - Display correlation statistics

## UI Layout
```
[ARL Selection Controls]
[Time Range Controls]
[Combined Traffic Analysis]
  - Overall vs ARL RPM Chart
  - Overall vs ARL RPS Chart
[Analysis Summary]
```

## Technical Implementation
- Modify ARLTrafficAnalysis component to include CombinedTrafficAnalysis
- Update data processing to handle both overall and ARL-specific metrics
- Implement synchronized filtering and controls
- Add analysis utilities for pattern comparison

## Next Steps
1. Switch to code mode for implementation
2. Begin with component restructuring
3. Add ARL selection functionality
4. Integrate combined traffic analysis
5. Implement analysis features