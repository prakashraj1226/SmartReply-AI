package com.smartreplyai.tenant;

import com.smartreplyai.appointment.Appointment;
import com.smartreplyai.auth.User;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.staff.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MultiTenantEntitiesTest {

    private Business salonBusiness;
    private Business dentalBusiness;

    @BeforeEach
    void setUp() {
        salonBusiness = new Business("Hair O Craft Salon", "hair-o-craft", "SALON", "contact@hairocraft.com", "+919876543210");
        salonBusiness.setId(UUID.randomUUID());
        salonBusiness.setIndustryType("SALON");
        salonBusiness.setAccountStatus("ACTIVE");

        dentalBusiness = new Business("ABC Dental Clinic", "abc-dental", "CLINIC", "care@abcdental.com", "+919876500112");
        dentalBusiness.setId(UUID.randomUUID());
        dentalBusiness.setIndustryType("DENTAL_CLINIC");
        dentalBusiness.setAccountStatus("ACTIVE");
    }

    @Test
    @DisplayName("Verify Business industryType and accountStatus isolation")
    void testBusinessIndustryType() {
        assertEquals("SALON", salonBusiness.getIndustryType());
        assertEquals("ACTIVE", salonBusiness.getAccountStatus());
        assertEquals("DENTAL_CLINIC", dentalBusiness.getIndustryType());
        assertNotEquals(salonBusiness.getId(), dentalBusiness.getId());
    }

    @Test
    @DisplayName("Verify Branch multi-location entity creation and tenant binding")
    void testBranchCreation() {
        Branch branch1 = new Branch(salonBusiness, "Hair O Craft - Anna Nagar", "102 2nd Ave, Chennai", "+919876543210", "Asia/Kolkata");
        branch1.setId(UUID.randomUUID());

        assertNotNull(branch1.getId());
        assertEquals(salonBusiness.getId(), branch1.getBusiness().getId());
        assertEquals("Hair O Craft - Anna Nagar", branch1.getName());
        assertTrue(branch1.isActive());
    }

    @Test
    @DisplayName("Verify ServiceItem catalog with pricing, duration, and buffer times")
    void testServiceItemCreation() {
        ServiceItem haircut = new ServiceItem(salonBusiness, null, "Classic Haircut & Styling", "Haircare", 45, new BigDecimal("450.00"));
        haircut.setId(UUID.randomUUID());
        haircut.setBufferBeforeMinutes(5);
        haircut.setBufferAfterMinutes(10);

        ServiceItem dentalCleaning = new ServiceItem(dentalBusiness, null, "Dental Scaling & Polishing", "Preventative", 30, new BigDecimal("1200.00"));
        dentalCleaning.setId(UUID.randomUUID());

        assertEquals(45, haircut.getDurationMinutes());
        assertEquals(5, haircut.getBufferBeforeMinutes());
        assertEquals(10, haircut.getBufferAfterMinutes());
        assertEquals(new BigDecimal("450.00"), haircut.getPrice());
        assertEquals(salonBusiness.getId(), haircut.getBusiness().getId());

        assertEquals(dentalBusiness.getId(), dentalCleaning.getBusiness().getId());
        assertNotEquals(haircut.getBusiness().getId(), dentalCleaning.getBusiness().getId());
    }

    @Test
    @DisplayName("Verify Staff entity creation with industry roles (Stylist vs Dentist)")
    void testStaffRolesAndTenantBinding() {
        Staff stylist = new Staff(salonBusiness, null, "Ravi Shankar", "STYLIST", "+919800011122", "ravi@hairocraft.com");
        stylist.setId(UUID.randomUUID());

        Staff dentist = new Staff(dentalBusiness, null, "Dr. Sunita Rao", "DENTIST", "+919800033344", "sunita@abcdental.com");
        dentist.setId(UUID.randomUUID());

        assertEquals("STYLIST", stylist.getStaffType());
        assertEquals(salonBusiness.getId(), stylist.getBusiness().getId());

        assertEquals("DENTIST", dentist.getStaffType());
        assertEquals(dentalBusiness.getId(), dentist.getBusiness().getId());
    }

    @Test
    @DisplayName("Verify StaffServiceMapping tenant-aware association")
    void testStaffServiceMapping() {
        Staff stylist = new Staff(salonBusiness, null, "Ravi Shankar", "STYLIST", "+919800011122", "ravi@hairocraft.com");
        stylist.setId(UUID.randomUUID());

        ServiceItem haircut = new ServiceItem(salonBusiness, null, "Classic Haircut", "Haircare", 30, new BigDecimal("350.00"));
        haircut.setId(UUID.randomUUID());

        StaffServiceMapping mapping = new StaffServiceMapping(salonBusiness, stylist, haircut);
        mapping.setId(UUID.randomUUID());

        assertEquals(salonBusiness.getId(), mapping.getBusiness().getId());
        assertEquals(stylist.getId(), mapping.getStaff().getId());
        assertEquals(haircut.getId(), mapping.getServiceItem().getId());
    }

    @Test
    @DisplayName("Verify StaffAvailability schedule and shift breaks")
    void testStaffAvailability() {
        Staff dentist = new Staff(dentalBusiness, null, "Dr. Sunita Rao", "DENTIST", "+919800033344", "sunita@abcdental.com");
        dentist.setId(UUID.randomUUID());

        LocalTime start = LocalTime.of(9, 0);
        LocalTime end = LocalTime.of(17, 0);
        LocalTime lunchStart = LocalTime.of(13, 0);
        LocalTime lunchEnd = LocalTime.of(14, 0);

        StaffAvailability mondayShift = new StaffAvailability(dentalBusiness, dentist, null, 1, start, end, lunchStart, lunchEnd);
        mondayShift.setId(UUID.randomUUID());

        assertEquals(1, mondayShift.getDayOfWeek());
        assertEquals(start, mondayShift.getStartTime());
        assertEquals(end, mondayShift.getEndTime());
        assertEquals(lunchStart, mondayShift.getBreakStartTime());
        assertEquals(lunchEnd, mondayShift.getBreakEndTime());
        assertTrue(mondayShift.isActive());
    }

    @Test
    @DisplayName("Verify StaffLeave holiday and exception tracking")
    void testStaffLeave() {
        Staff dentist = new Staff(dentalBusiness, null, "Dr. Sunita Rao", "DENTIST", "+919800033344", "sunita@abcdental.com");
        dentist.setId(UUID.randomUUID());

        LocalDate leaveDay = LocalDate.now().plusDays(5);
        StaffLeave leave = new StaffLeave(dentalBusiness, dentist, leaveDay, "Attending Dental Conference");
        leave.setId(UUID.randomUUID());

        assertEquals(leaveDay, leave.getLeaveDate());
        assertEquals("Attending Dental Conference", leave.getReason());
        assertEquals("APPROVED", leave.getStatus());
        assertEquals(dentalBusiness.getId(), leave.getBusiness().getId());
    }

    @Test
    @DisplayName("Verify Appointment backward compatibility with new structured fields")
    void testAppointmentBackwardCompatibility() {
        Customer customer = new Customer(salonBusiness, "+919999988888", "Kavita Nair", "kavita@example.com");
        customer.setId(UUID.randomUUID());

        Branch branch = new Branch(salonBusiness, "Anna Nagar", "Address", "Phone", "Asia/Kolkata");
        branch.setId(UUID.randomUUID());

        ServiceItem service = new ServiceItem(salonBusiness, branch, "Hair Spa Deluxe", "Haircare", 60, new BigDecimal("1200.00"));
        service.setId(UUID.randomUUID());

        Staff staff = new Staff(salonBusiness, branch, "Anita", "STYLIST", "Phone", "anita@hairocraft.com");
        staff.setId(UUID.randomUUID());

        Instant start = Instant.now().plusSeconds(3600);
        Instant end = start.plusSeconds(3600);

        // Uses legacy constructor
        Appointment appt = new Appointment(salonBusiness, customer, "Hair Spa Deluxe", "Anita", start, end, "CONFIRMED", "VIP client");
        appt.setId(UUID.randomUUID());

        // Assigns new structured references seamlessly
        appt.setBranch(branch);
        appt.setServiceItem(service);
        appt.setStaff(staff);
        appt.setBookingSource("WHATSAPP");

        assertEquals("Hair Spa Deluxe", appt.getServiceName());
        assertEquals("Anita", appt.getStaffName());
        assertEquals(branch.getId(), appt.getBranch().getId());
        assertEquals(service.getId(), appt.getServiceItem().getId());
        assertEquals(staff.getId(), appt.getStaff().getId());
        assertEquals("WHATSAPP", appt.getBookingSource());
        assertEquals("CONFIRMED", appt.getStatus());
    }

    @Test
    @DisplayName("Verify BusinessMember membership status and joinedAt")
    void testBusinessMemberStatus() {
        User user = new User("admin@hairocraft.com", "hash", "Admin User", "BUSINESS_OWNER");
        user.setId(UUID.randomUUID());

        BusinessMember member = new BusinessMember(salonBusiness, user, "BUSINESS_OWNER");
        member.setId(UUID.randomUUID());

        assertEquals("ACTIVE", member.getMembershipStatus());
        assertNotNull(member.getJoinedAt());
        assertEquals(salonBusiness.getId(), member.getBusiness().getId());
        assertEquals(user.getId(), member.getUser().getId());
    }
}
