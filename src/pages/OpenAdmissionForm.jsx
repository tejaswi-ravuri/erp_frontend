import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AdmissionForm from "../components/admissions/AdmissionForm";
import { updateApplication } from "../../../Backend/src/controllers/admissionController";

function OpenAdmissionForm() {
  const location = useLocation();
  const admissionData = location?.state?.admissionData;

  return (
    <div>
      <AdmissionForm admission={admissionData} isModelView={false} />
    </div>
  );
}

export default OpenAdmissionForm;
