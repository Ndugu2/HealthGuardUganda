# Mashvisor -- Enterprise Sample Data Pack
Date: February 2026

------------------------------------------------------------------------

## Overview

This sample data pack is provided to illustrate **Mashvisor's data
structure, consistency, and integration readiness** for enterprise
partners.

The files included reflect **production-grade schemas and metric
definitions**, with a deliberately limited scope to support technical
review, product evaluation, and internal alignment discussions.

This is **not a full data delivery** and does not represent complete
market coverage or contractual data access.

Mashvisor's production environment supports **nationwide U.S. coverage,
multi-year historical depth, and API-driven delivery at scale**. This
sample prioritizes structural clarity over volume.

------------------------------------------------------------------------

## What This Sample Demonstrates

This sample is designed to showcase:

-   Clean, predictable schemas suitable for enterprise ingestion\
-   API-first architecture designed for downstream systems\
-   Consistent metric definitions across STR and LTR use cases\
-   Historical time-series rental performance\
-   Explainable comparable selection logic for valuation workflows\
-   Structured JSON delivery optimized for integration

The focus is on **clarity, explainability, governance, and usability**,
not dataset breadth.

------------------------------------------------------------------------

## What This Sample Intentionally Excludes

To ensure safe evaluation and avoid misinterpretation, this sample
intentionally excludes:

-   Full nationwide market coverage\
-   All optional or extended attributes\
-   Personally identifiable information (PII)\
-   Proprietary partner-specific enrichments\
-   Real-time or continuously updating production feeds\
-   Full historical depth available in live environments

Access to broader datasets, additional metrics, or custom schemas is
discussed separately based on use case and scope.

------------------------------------------------------------------------

## Included Files

### 1. `STR_Monthly_Performance_ZIP.csv`

Aggregated short-term rental performance for a single ZIP code.

**Purpose** - Demonstrate historical time-series depth\
- Illustrate metric consistency across months\
- Support modeling, forecasting, and BI ingestion review

**Key Metrics** - Active listings\
- Occupancy rate\
- Average Daily Rate (ADR)\
- Estimated monthly revenue

This structure reflects Mashvisor's standardized aggregation logic used
across markets.

------------------------------------------------------------------------

### 2. `Property_and_Comps_Snapshot.csv`

A snapshot of one subject property with a small set of comparable
properties.

**Purpose** - Demonstrate explainable comparable selection logic\
- Support valuation modeling and benchmarking workflows\
- Illustrate structured JSON delivery for downstream integration

**Key Concepts** - Clear subject vs. comparable identification\
- Distance and similarity context\
- Structured STR performance metrics\
- Predictable schema suitable for ingestion

Comparable selection methodology combines similarity scoring and
geographic proximity, designed for transparency and explainability.

------------------------------------------------------------------------

### 3. `Address_Lookup_API_Response.json`

A representative API response for an address-level lookup.

**Purpose** - Demonstrate production API schema design\
- Illustrate property, rental, and investment metric structuring\
- Show integration-ready JSON formatting

**Includes** - Property attributes\
- Short-term rental estimates\
- Long-term rental estimates\
- Investment performance metrics\
- Metadata supporting auditability and traceability

This reflects Mashvisor's API-first delivery architecture.

------------------------------------------------------------------------

## Metric Definitions & Consistency

All metrics shown follow **Mashvisor's production definitions**,
including:

-   Standardized occupancy calculations\
-   Consistent ADR and revenue methodologies\
-   Normalized property and market identifiers\
-   Structured revenue estimation logic\
-   Version-controlled schema evolution\
-   Backward compatibility considerations for enterprise integrations\
-   Metadata to support traceability and downstream governance

Detailed documentation and field-level definitions are available upon
request.

------------------------------------------------------------------------

## Data Refresh & Methodology (High-Level)

Mashvisor data is derived from a combination of:

-   Publicly available records\
-   Observed market behavior from platform activity\
-   Modeled signals calibrated against verified transaction patterns

Production systems include:

-   Entity resolution and deduplication\
-   Continuous quality monitoring\
-   Anomaly detection pipelines\
-   Versioned schema management\
-   Structured validation workflows

This sample reflects the **data structure and schema design**, not the
full operational cadence or refresh frequency of production systems.

------------------------------------------------------------------------

## Governance & Integration Considerations

Mashvisor's data architecture is designed to support:

-   Enterprise ingestion pipelines\
-   Data warehouse integration\
-   BI and analytics workflows\
-   Forecasting and modeling environments\
-   API-based consumption at scale

Schema stability, documentation, and controlled evolution are central to
production delivery.

------------------------------------------------------------------------

## Intended Use

This sample is intended to support:

-   Internal technical review\
-   Product and architecture discussions\
-   Use-case mapping\
-   Pilot scoping and integration planning

It should not be used for production, commercial decisioning, or
external redistribution.

------------------------------------------------------------------------

## Next Steps

If helpful, Mashvisor can provide:

-   Expanded sample datasets\
-   Additional geographies\
-   Extended historical depth\
-   Custom schema alignment\
-   API walkthrough sessions\
-   Pilot program planning

For questions or follow-up discussions:

**Ahmed Hashlamon**\
Head of Data\
Mashvisor\
ahmadh@mashvisor.com\
https://calendly.com/mashvisor/partner-with-mashvisor
