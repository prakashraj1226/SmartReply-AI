package com.smartreplyai.business.onboarding;

import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.staff.StaffAvailability;
import com.smartreplyai.staff.StaffAvailabilityRepository;
import com.smartreplyai.staff.StaffRepository;
import com.smartreplyai.staff.StaffServiceMapping;
import com.smartreplyai.staff.StaffServiceMappingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.*;

@Service
public class BusinessOnboardingService {

    private final BusinessRepository businessRepository;
    private final BranchRepository branchRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final StaffRepository staffRepository;
    private final StaffServiceMappingRepository staffServiceMappingRepository;
    private final StaffAvailabilityRepository staffAvailabilityRepository;

    public BusinessOnboardingService(BusinessRepository businessRepository,
                                     BranchRepository branchRepository,
                                     ServiceItemRepository serviceItemRepository,
                                     StaffRepository staffRepository,
                                     StaffServiceMappingRepository staffServiceMappingRepository,
                                     StaffAvailabilityRepository staffAvailabilityRepository) {
        this.businessRepository = businessRepository;
        this.branchRepository = branchRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffRepository = staffRepository;
        this.staffServiceMappingRepository = staffServiceMappingRepository;
        this.staffAvailabilityRepository = staffAvailabilityRepository;
    }

    @Transactional
    public Map<String, Object> applyTemplate(UUID businessId, ApplyTemplateRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        String industry = request.getIndustryType().trim().toUpperCase();
        business.setIndustryType(industry);

        // 1. Ensure a primary Branch exists
        List<Branch> existingBranches = branchRepository.findByBusinessId(businessId);
        Branch primaryBranch;
        if (existingBranches.isEmpty()) {
            String defaultBranchName = request.getBranchName() != null && !request.getBranchName().isBlank()
                    ? request.getBranchName().trim()
                    : switch (industry) {
                        case "SALON" -> "Main Studio";
                        case "DENTAL_CLINIC" -> "Main Dental Clinic";
                        case "HOSPITAL" -> "Main Hospital OPD";
                        default -> "Main Branch";
                    };
            primaryBranch = new Branch(business, defaultBranchName, business.getAddress(), business.getPhone(), business.getTimezone());
            primaryBranch = branchRepository.save(primaryBranch);
        } else {
            primaryBranch = existingBranches.get(0);
        }

        // 2. Provision Services & Staff based on industry
        List<ServiceItem> createdServices = new ArrayList<>();
        List<Staff> createdStaff = new ArrayList<>();

        switch (industry) {
            case "SALON" -> seedSalon(business, primaryBranch, createdServices, createdStaff);
            case "DENTAL_CLINIC" -> seedDentalClinic(business, primaryBranch, createdServices, createdStaff);
            case "HOSPITAL" -> seedHospital(business, primaryBranch, createdServices, createdStaff);
            default -> seedGeneral(business, primaryBranch, createdServices, createdStaff);
        }

        business.setOnboardingCompleted(true);
        businessRepository.save(business);

        Map<String, Object> response = new HashMap<>();
        response.put("industryType", industry);
        response.put("branchName", primaryBranch.getName());
        response.put("branchId", primaryBranch.getId());
        response.put("servicesCreated", createdServices.size());
        response.put("staffCreated", createdStaff.size());
        response.put("onboardingCompleted", true);
        return response;
    }

    private void seedSalon(Business business, Branch branch,
                           List<ServiceItem> createdServices, List<Staff> createdStaff) {
        // Services
        ServiceItem haircut = createService(business, branch, "Classic Haircut & Styling", "Hair Care", "Professional haircut, hair wash, and blow dry styling", 45, 10, 10, new BigDecimal("500"));
        ServiceItem hairSpa = createService(business, branch, "Hair Spa & Deep Conditioning", "Hair Care", "Intense hydration therapy for damaged hair with scalp massage", 60, 10, 15, new BigDecimal("1200"));
        ServiceItem facial = createService(business, branch, "Skin Glow & Brightening Facial", "Skin & Facial", "Deep cleansing facial with vitamin C serum and herbal mask", 60, 10, 15, new BigDecimal("1500"));
        ServiceItem keratin = createService(business, branch, "Keratin Smooth Treatment", "Hair Care", "Protein-infused smoothing treatment for frizz-free hair", 120, 15, 20, new BigDecimal("3500"));
        ServiceItem maniPedi = createService(business, branch, "Deluxe Pedicure & Manicure", "Nails & Spa", "Complete exfoliation, cuticle care, and massage", 60, 10, 10, new BigDecimal("900"));

        createdServices.addAll(List.of(haircut, hairSpa, facial, keratin, maniPedi));

        // Staff
        Staff stylist = createStaff(business, branch, "Senior Stylist", "STYLIST", business.getPhone(), null);
        Staff beautician = createStaff(business, branch, "Skin & Spa Specialist", "BEAUTICIAN", business.getPhone(), null);

        createdStaff.addAll(List.of(stylist, beautician));

        // Mappings
        linkStaffToServices(business, stylist, List.of(haircut, hairSpa, keratin));
        linkStaffToServices(business, beautician, List.of(facial, maniPedi, hairSpa));
    }

    private void seedDentalClinic(Business business, Branch branch,
                                  List<ServiceItem> createdServices, List<Staff> createdStaff) {
        ServiceItem consultation = createService(business, branch, "Dental Consultation & Digital X-Ray", "Consultation", "Comprehensive oral checkup with digital imaging", 30, 10, 10, new BigDecimal("500"));
        ServiceItem scaling = createService(business, branch, "Ultrasonic Scaling & Polishing", "Preventive Care", "Deep tartar removal and prophylactic enamel polishing", 45, 10, 15, new BigDecimal("1200"));
        ServiceItem rct = createService(business, branch, "Single-Sitting Root Canal Treatment", "Endodontics", "Painless laser-assisted root canal procedure", 60, 15, 15, new BigDecimal("3500"));
        ServiceItem whitening = createService(business, branch, "Laser Teeth Whitening", "Cosmetic Dentistry", "In-office LED smile brightening by 5+ shades", 60, 15, 15, new BigDecimal("5000"));
        ServiceItem filling = createService(business, branch, "Composite Dental Filling", "Restorative Care", "Tooth-colored composite restoration for cavities", 40, 10, 10, new BigDecimal("1000"));

        createdServices.addAll(List.of(consultation, scaling, rct, whitening, filling));

        Staff dentist = createStaff(business, branch, "Dr. Lead Dental Surgeon", "DENTIST", business.getPhone(), null);
        Staff assistant = createStaff(business, branch, "Clinical Assistant", "STAFF", business.getPhone(), null);

        createdStaff.addAll(List.of(dentist, assistant));

        linkStaffToServices(business, dentist, List.of(consultation, scaling, rct, whitening, filling));
        linkStaffToServices(business, assistant, List.of(consultation, scaling));
    }

    private void seedHospital(Business business, Branch branch,
                              List<ServiceItem> createdServices, List<Staff> createdStaff) {
        ServiceItem genMed = createService(business, branch, "General Physician OPD Consultation", "General Medicine", "Outpatient clinical consultation with vitals check", 20, 5, 10, new BigDecimal("600"));
        ServiceItem cardio = createService(business, branch, "Cardiology Review & ECG Consultation", "Cardiology", "Heart health assessment and ECG interpretation", 30, 10, 15, new BigDecimal("1200"));
        ServiceItem pedia = createService(business, branch, "Pediatric Health Checkup", "Pediatrics", "Growth and developmental checkup for infants and children", 25, 5, 10, new BigDecimal("700"));
        ServiceItem derma = createService(business, branch, "Dermatology & Skin Consultation", "Dermatology", "Expert diagnosis and prescription for skin conditions", 25, 5, 10, new BigDecimal("800"));

        createdServices.addAll(List.of(genMed, cardio, pedia, derma));

        Staff physician = createStaff(business, branch, "Dr. General Physician", "DOCTOR", business.getPhone(), null);
        Staff specialist = createStaff(business, branch, "Dr. Consultant Specialist", "DOCTOR", business.getPhone(), null);

        createdStaff.addAll(List.of(physician, specialist));

        linkStaffToServices(business, physician, List.of(genMed, pedia));
        linkStaffToServices(business, specialist, List.of(cardio, derma));
    }

    private void seedGeneral(Business business, Branch branch,
                             List<ServiceItem> createdServices, List<Staff> createdStaff) {
        ServiceItem generalConsult = createService(business, branch, "Standard Consultation", "General", "General appointment and assessment session", 30, 5, 10, new BigDecimal("500"));
        ServiceItem extendedSession = createService(business, branch, "Extended Session", "General", "Full comprehensive consultation and advisory service", 60, 10, 15, new BigDecimal("1000"));

        createdServices.addAll(List.of(generalConsult, extendedSession));

        Staff staffMember = createStaff(business, branch, "Primary Specialist", "STAFF", business.getPhone(), null);
        createdStaff.add(staffMember);

        linkStaffToServices(business, staffMember, List.of(generalConsult, extendedSession));
    }

    private ServiceItem createService(Business business, Branch branch, String name, String category,
                                      String description, int duration, int bufferBefore, int bufferAfter, BigDecimal price) {
        ServiceItem s = new ServiceItem();
        s.setBusiness(business);
        s.setBranch(branch);
        s.setName(name);
        s.setCategory(category);
        s.setDescription(description);
        s.setDurationMinutes(duration);
        s.setBufferBeforeMinutes(bufferBefore);
        s.setBufferAfterMinutes(bufferAfter);
        s.setPrice(price);
        s.setCurrency("INR");
        s.setActive(true);
        return serviceItemRepository.save(s);
    }

    private Staff createStaff(Business business, Branch branch, String name, String staffType, String phone, String email) {
        Staff staff = new Staff(business, branch, name, staffType, phone, email);
        staff = staffRepository.save(staff);

        // Monday to Saturday: 09:00 - 18:00, Lunch: 13:00 - 14:00
        for (int day = 1; day <= 6; day++) {
            StaffAvailability a = new StaffAvailability(
                    business, staff, branch, day,
                    LocalTime.of(9, 0), LocalTime.of(18, 0),
                    LocalTime.of(13, 0), LocalTime.of(14, 0)
            );
            staffAvailabilityRepository.save(a);
        }
        return staff;
    }

    private void linkStaffToServices(Business business, Staff staff, List<ServiceItem> services) {
        for (ServiceItem s : services) {
            StaffServiceMapping mapping = new StaffServiceMapping(business, staff, s);
            staffServiceMappingRepository.save(mapping);
        }
    }

    public List<Map<String, Object>> getAvailableTemplates() {
        return List.of(
                Map.of(
                        "id", "SALON",
                        "title", "Hair Salon & Beauty Parlour",
                        "description", "Pre-configured for hair styling, skin care, facials, and spa with Stylist and Beautician roles.",
                        "sampleServices", List.of("Haircut & Styling", "Hair Spa", "Glow Facial", "Keratin Treatment", "Pedicure & Manicure")
                ),
                Map.of(
                        "id", "DENTAL_CLINIC",
                        "title", "Dental Clinic",
                        "description", "Pre-configured for dental consultations, scaling, root canals, and cosmetic smile designs with Dentist roles.",
                        "sampleServices", List.of("Dental Consultation", "Ultrasonic Scaling", "Root Canal Treatment", "Teeth Whitening")
                ),
                Map.of(
                        "id", "HOSPITAL",
                        "title", "Hospital & Healthcare Clinic",
                        "description", "Pre-configured for multi-department outpatient consultations with Doctor roles.",
                        "sampleServices", List.of("General Physician Consultation", "Cardiology Review", "Pediatric Checkup", "Dermatology Consultation")
                ),
                Map.of(
                        "id", "GENERAL",
                        "title", "General Appointment Business",
                        "description", "Standard consultation services suitable for consultants, therapists, and tutors.",
                        "sampleServices", List.of("Standard Consultation", "Extended Session")
                )
        );
    }
}
