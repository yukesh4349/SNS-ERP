"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle,
  Printer,
  Plus
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { createStudent, getNextStudentIds } from "../../services/users-service";

export function AdmissionPage() {
  const [formData, setFormData] = useState({
    admissionNo: "Loading...",
    studentId: "Loading...",
    firstName: "",
    lastName: "",
    gender: "",
    grade: "", 
    section: "A", 
    dob: "",
    birthCertNo: "",
    nationality: "",
    religion: "",
    community: "",
    bloodGroup: "",
    address: "",
    presentSchool: "",
    previousGrade: "",
    boardOfEducation: "",
    motherTongue: "",
    fatherName: "",
    fatherContact: "",
    fatherEmail: "",
    fatherEducation: "",
    fatherOccupation: "",
    fatherOrganization: "",
    fatherDesignation: "",
    fatherOfficeAddress: "",
    motherName: "",
    motherContact: "",
    motherEmail: "",
    motherEducation: "",
    motherOccupation: "",
    motherOrganization: "",
    motherDesignation: "",
    motherOfficeAddress: "",
    password: "SNSAC@123",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isValid = !!(
    formData.firstName && formData.lastName && formData.gender && formData.grade && 
    formData.dob && formData.birthCertNo && formData.nationality && formData.religion && 
    formData.community && formData.bloodGroup && formData.motherTongue &&
    formData.presentSchool && formData.previousGrade && formData.boardOfEducation &&
    formData.fatherName && formData.fatherContact && formData.fatherEmail && 
    formData.motherName && formData.motherContact && formData.motherEmail
  );

  useEffect(() => {
    async function loadNextIds() {
      try {
        const ids = await getNextStudentIds();
        setFormData(prev => ({
          ...prev,
          admissionNo: ids.admissionNo,
          studentId: ids.studentId
        }));
      } catch (e) {
        console.error(e);
      }
    }
    loadNextIds();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await createStudent({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.fatherEmail || formData.motherEmail || `${formData.firstName.toLowerCase()}${Math.floor(Math.random()*1000)}@sns.edu`,
        department: "Academic",
        class: formData.grade,
        section: formData.section,
        gender: formData.gender,
        dob: formData.dob,
        birthCertNo: formData.birthCertNo,
        nationality: formData.nationality,
        religion: formData.religion,
        community: formData.community,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        presentSchool: formData.presentSchool,
        previousGrade: formData.previousGrade,
        boardOfEducation: formData.boardOfEducation,
        motherTongue: formData.motherTongue,
        fatherName: formData.fatherName,
        fatherContact: formData.fatherContact,
        fatherEmail: formData.fatherEmail,
        fatherEducation: formData.fatherEducation,
        fatherOccupation: formData.fatherOccupation,
        fatherOrganization: formData.fatherOrganization,
        fatherDesignation: formData.fatherDesignation,
        fatherOfficeAddress: formData.fatherOfficeAddress,
        motherName: formData.motherName,
        motherContact: formData.motherContact,
        motherEmail: formData.motherEmail,
        motherEducation: formData.motherEducation,
        motherOccupation: formData.motherOccupation,
        motherOrganization: formData.motherOrganization,
        motherDesignation: formData.motherDesignation,
        motherOfficeAddress: formData.motherOfficeAddress,
        password: formData.password,
      });
      
      // Update form data with the actual IDs returned by the backend
      setFormData(prev => ({
        ...prev,
        admissionNo: response.studentProfile?.admissionNo || response.admissionNo || "ADM-SUCCESS",
        studentId: response.studentProfile?.studentId || response.studentId || "STU-SUCCESS",
      }));
      setIsSubmitted(true);
      alert("Student enrolled successfully! You can now print the form.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to enroll student");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = async () => {
    setFormData({
      admissionNo: "Loading...", studentId: "Loading...", firstName: "", lastName: "", gender: "", grade: "", section: "A", dob: "", birthCertNo: "", nationality: "", religion: "", community: "", bloodGroup: "", address: "", presentSchool: "", previousGrade: "", boardOfEducation: "", motherTongue: "", fatherName: "", fatherContact: "", fatherEmail: "", fatherEducation: "", fatherOccupation: "", fatherOrganization: "", fatherDesignation: "", fatherOfficeAddress: "", motherName: "", motherContact: "", motherEmail: "", motherEducation: "", motherOccupation: "", motherOrganization: "", motherDesignation: "", motherOfficeAddress: "", password: "SNSAC@123"
    });
    setIsSubmitted(false);
    try {
      const ids = await getNextStudentIds();
      setFormData(prev => ({...prev, admissionNo: ids.admissionNo, studentId: ids.studentId }));
    } catch(e) {}
  };

  return (
    <PageSection
      eyebrow="Enrollment Management"
      title="Single-Page Admission Form"
      description="Register new students into the SNS Academy database quickly."
    >
      <div className="w-full print:hidden">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs">
          
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
             <h3 className="text-base font-bold text-slate-900">Student Enrollment Form</h3>
             <div className="flex gap-2">
               {isSubmitted ? (
                 <>
                   <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all">
                     <Printer size={16} /> Print Form
                   </button>
                   <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-[#FF7F50] text-white rounded-lg font-bold hover:bg-[#e66a3e] transition-all">
                     <Plus size={16} /> New Application
                   </button>
                 </>
               ) : (
                 <button 
                   onClick={handleSave}
                   disabled={isSaving || !isValid}
                   className="flex items-center gap-2 px-6 py-2 bg-[#FF7F50] text-white rounded-lg font-bold hover:bg-[#e66a3e] transition-all disabled:opacity-50"
                 >
                   {isSaving ? "Saving..." : "Submit Application"} <CheckCircle size={16} />
                 </button>
               )}
             </div>
          </div>

          <div className="space-y-4">
            {/* System Info */}
            <div className="grid grid-cols-5 gap-3">
              <InputField label="Admission No" value={formData.admissionNo} disabled={true} onChange={() => {}} />
              <InputField label="Student ID" value={formData.studentId} disabled={true} onChange={() => {}} />
              <InputField label="Default Password" value={formData.password} disabled={true} onChange={() => {}} />
            </div>

            {/* Student Details */}
            <div>
              <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">Student Details</h4>
              <div className="grid grid-cols-5 gap-3">
                <InputField label="First Name*" value={formData.firstName} onChange={(v) => setFormData({...formData, firstName: v})} disabled={isSubmitted} />
                <InputField label="Last Name*" value={formData.lastName} onChange={(v) => setFormData({...formData, lastName: v})} disabled={isSubmitted} />
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender*</label>
                  <select disabled={isSubmitted} value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#FF7F50] disabled:opacity-50">
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <InputField label="DOB*" type="date" value={formData.dob} onChange={(v) => setFormData({...formData, dob: v})} disabled={isSubmitted} />
                <InputField label="Class*" value={formData.grade} onChange={(v) => setFormData({...formData, grade: v})} disabled={isSubmitted} />
                
                <InputField label="Birth Cert No*" value={formData.birthCertNo} onChange={(v) => setFormData({...formData, birthCertNo: v})} disabled={isSubmitted} />
                <InputField label="Nationality*" value={formData.nationality} onChange={(v) => setFormData({...formData, nationality: v})} disabled={isSubmitted} />
                <InputField label="Religion*" value={formData.religion} onChange={(v) => setFormData({...formData, religion: v})} disabled={isSubmitted} />
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Community*</label>
                  <select disabled={isSubmitted} value={formData.community} onChange={(e) => setFormData({...formData, community: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#FF7F50] disabled:opacity-50">
                    <option value="">Select</option><option value="BC">BC</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="Others">Others</option>
                  </select>
                </div>
                <InputField label="Blood Group*" value={formData.bloodGroup} onChange={(v) => setFormData({...formData, bloodGroup: v})} disabled={isSubmitted} />
                <div className="col-span-5">
                  <InputField label="Permanent Address*" value={formData.address} onChange={(v) => setFormData({...formData, address: v})} disabled={isSubmitted} placeholder="Full residential address" />
                </div>
              </div>
            </div>

            {/* Previous Education */}
            <div>
              <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">Previous Education</h4>
              <div className="grid grid-cols-4 gap-3">
                <InputField label="Previous School*" value={formData.presentSchool} onChange={(v) => setFormData({...formData, presentSchool: v})} disabled={isSubmitted} />
                <InputField label="Previous Grade*" value={formData.previousGrade} onChange={(v) => setFormData({...formData, previousGrade: v})} disabled={isSubmitted} />
                <InputField label="Board of Education*" value={formData.boardOfEducation} onChange={(v) => setFormData({...formData, boardOfEducation: v})} disabled={isSubmitted} />
                <InputField label="Mother Tongue*" value={formData.motherTongue} onChange={(v) => setFormData({...formData, motherTongue: v})} disabled={isSubmitted} />
              </div>
            </div>

            {/* Parent Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">Father's Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Name*" value={formData.fatherName} onChange={(v) => setFormData({...formData, fatherName: v})} disabled={isSubmitted} />
                  <InputField label="Contact No*" value={formData.fatherContact} onChange={(v) => setFormData({...formData, fatherContact: v})} disabled={isSubmitted} />
                  <InputField label="Email*" value={formData.fatherEmail} onChange={(v) => setFormData({...formData, fatherEmail: v})} disabled={isSubmitted} />
                  <InputField label="Education" value={formData.fatherEducation} onChange={(v) => setFormData({...formData, fatherEducation: v})} disabled={isSubmitted} />
                  <InputField label="Occupation" value={formData.fatherOccupation} onChange={(v) => setFormData({...formData, fatherOccupation: v})} disabled={isSubmitted} />
                  <InputField label="Organization" value={formData.fatherOrganization} onChange={(v) => setFormData({...formData, fatherOrganization: v})} disabled={isSubmitted} />
                  <InputField label="Designation" value={formData.fatherDesignation} onChange={(v) => setFormData({...formData, fatherDesignation: v})} disabled={isSubmitted} />
                  <InputField label="Office Address" value={formData.fatherOfficeAddress} onChange={(v) => setFormData({...formData, fatherOfficeAddress: v})} disabled={isSubmitted} />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">Mother's Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Name*" value={formData.motherName} onChange={(v) => setFormData({...formData, motherName: v})} disabled={isSubmitted} />
                  <InputField label="Contact No*" value={formData.motherContact} onChange={(v) => setFormData({...formData, motherContact: v})} disabled={isSubmitted} />
                  <InputField label="Email*" value={formData.motherEmail} onChange={(v) => setFormData({...formData, motherEmail: v})} disabled={isSubmitted} />
                  <InputField label="Education" value={formData.motherEducation} onChange={(v) => setFormData({...formData, motherEducation: v})} disabled={isSubmitted} />
                  <InputField label="Occupation" value={formData.motherOccupation} onChange={(v) => setFormData({...formData, motherOccupation: v})} disabled={isSubmitted} />
                  <InputField label="Organization" value={formData.motherOrganization} onChange={(v) => setFormData({...formData, motherOrganization: v})} disabled={isSubmitted} />
                  <InputField label="Designation" value={formData.motherDesignation} onChange={(v) => setFormData({...formData, motherDesignation: v})} disabled={isSubmitted} />
                  <InputField label="Office Address" value={formData.motherOfficeAddress} onChange={(v) => setFormData({...formData, motherOfficeAddress: v})} disabled={isSubmitted} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-3xl font-black text-slate-900">SNS Academy</h1>
            <p className="text-slate-500 text-lg mt-2">Student Admission Details</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#FF7F50] border-b pb-2">System Credentials</h2>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Admission No:</span> {formData.admissionNo}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Student ID:</span> {formData.studentId}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Login Password:</span> {formData.password}</p>

              <h2 className="font-bold text-lg mb-4 mt-6 text-[#FF7F50] border-b pb-2">Student Details</h2>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Name:</span> {formData.firstName} {formData.lastName}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Class:</span> {formData.grade} - {formData.section}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Gender:</span> {formData.gender}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">DOB:</span> {formData.dob}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Nationality:</span> {formData.nationality}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Religion / Community:</span> {formData.religion} / {formData.community}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Address:</span> {formData.address}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Previous School:</span> {formData.presentSchool}</p>
            </div>
            
            <div>
              <h2 className="font-bold text-lg mb-4 text-[#FF7F50] border-b pb-2">Parent Details</h2>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Father's Name:</span> {formData.fatherName}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Father's Contact:</span> {formData.fatherContact}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Mother's Name:</span> {formData.motherName}</p>
              <p className="mb-2"><span className="font-bold w-40 inline-block">Mother's Contact:</span> {formData.motherContact}</p>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t-2 border-slate-200 flex justify-between px-8">
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-600">Parent/Guardian Signature</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-600">Principal Signature</p>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
}

function InputField({ label, placeholder, value, onChange, type = "text", disabled = false }: { label: string, placeholder?: string, value: string, onChange: (v: string) => void, type?: string, disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#FF7F50] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
