"use client";

import React from "react";
import { SparkleExtractingIcon } from "./SparkleExtractingIcon";

type ExtractingAnimationViewProps = {
  stage?: string;
  percent?: number;
};

export function ExtractingAnimationView({
  stage = "Analyzing question structure and student answers...",
  percent = 45
}: ExtractingAnimationViewProps) {
  return (
    <section className="extracting-view-container">
      <div className="extracting-content">
        <SparkleExtractingIcon />
        <h1 className="extracting-title">Extracting...</h1>
        <p className="extracting-subtitle">This may take a while</p>

        {/* Live Processing Pipeline Status */}
        <div className="extracting-progress-box">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(10, percent))}%` }}
            />
          </div>
          <p className="progress-stage-text">{stage}</p>
        </div>
      </div>
    </section>
  );
}
