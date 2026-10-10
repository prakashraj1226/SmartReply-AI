package com.smartreplyai.customer;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.customer.dto.CreateCustomerRequest;
import com.smartreplyai.customer.dto.CustomerDto;
import com.smartreplyai.customer.dto.UpdateCustomerRequest;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BusinessRepository businessRepository;

    public CustomerService(CustomerRepository customerRepository, BusinessRepository businessRepository) {
        this.customerRepository = customerRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional(readOnly = true)
    public Page<CustomerDto> getCustomers(UUID businessId, String query, Pageable pageable) {
        Page<Customer> page;
        if (query != null && !query.isBlank()) {
            page = customerRepository.searchCustomers(businessId, query.trim(), pageable);
        } else {
            page = customerRepository.findByBusinessId(businessId, pageable);
        }
        return page.map(CustomerDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(UUID businessId, UUID customerId) {
        Customer customer = customerRepository.findByBusinessIdAndId(businessId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return CustomerDto.fromEntity(customer);
    }

    @Transactional
    public CustomerDto createCustomer(UUID businessId, CreateCustomerRequest req) {
        String phone = req.getPhoneNumber().trim();
        if (customerRepository.existsByBusinessIdAndPhoneNumber(businessId, phone)) {
            throw new BadRequestException("A customer with phone number " + phone + " already exists");
        }

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        Customer customer = new Customer();
        customer.setBusiness(business);
        customer.setPhoneNumber(phone);
        customer.setName(req.getName());
        customer.setEmail(req.getEmail());
        customer.setOptInStatus(req.getOptInStatus() != null ? req.getOptInStatus() : "OPTED_IN");
        customer.setTagsJson(req.getTagsJson() != null ? req.getTagsJson() : "[]");
        customer.setNotes(req.getNotes());

        customer = customerRepository.save(customer);
        return CustomerDto.fromEntity(customer);
    }

    @Transactional
    public CustomerDto updateCustomer(UUID businessId, UUID customerId, UpdateCustomerRequest req) {
        Customer customer = customerRepository.findByBusinessIdAndId(businessId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (req.getName() != null) customer.setName(req.getName());
        if (req.getEmail() != null) customer.setEmail(req.getEmail());
        if (req.getOptInStatus() != null) customer.setOptInStatus(req.getOptInStatus());
        if (req.getTagsJson() != null) customer.setTagsJson(req.getTagsJson());
        if (req.getNotes() != null) customer.setNotes(req.getNotes());

        customer = customerRepository.save(customer);
        return CustomerDto.fromEntity(customer);
    }

    @Transactional
    public void deleteCustomer(UUID businessId, UUID customerId) {
        Customer customer = customerRepository.findByBusinessIdAndId(businessId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        customerRepository.delete(customer);
    }

    @Transactional(readOnly = true)
    public String exportCustomersCsv(UUID businessId) {
        List<Customer> customers = customerRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
        StringWriter sw = new StringWriter();

        try (CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.builder()
                .setHeader("ID", "Name", "Phone Number", "Email", "Opt-In Status", "Tags", "Notes", "Created At")
                .build())) {

            for (Customer c : customers) {
                printer.printRecord(
                        c.getId(),
                        c.getName() != null ? c.getName() : "",
                        c.getPhoneNumber(),
                        c.getEmail() != null ? c.getEmail() : "",
                        c.getOptInStatus(),
                        c.getTagsJson(),
                        c.getNotes() != null ? c.getNotes() : "",
                        c.getCreatedAt()
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Error exporting customers to CSV", e);
        }

        return sw.toString();
    }
}
