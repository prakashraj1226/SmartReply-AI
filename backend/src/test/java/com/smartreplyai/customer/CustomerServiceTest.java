package com.smartreplyai.customer;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.dto.CreateCustomerRequest;
import com.smartreplyai.customer.dto.CustomerDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private CustomerService customerService;

    @Test
    void createCustomer_ShouldPersistAndReturnDto() {
        UUID businessId = UUID.randomUUID();
        CreateCustomerRequest req = new CreateCustomerRequest("+919876543210", "Ananya Verma", "ananya@example.com");

        when(customerRepository.existsByBusinessIdAndPhoneNumber(businessId, "+919876543210")).thenReturn(false);

        Business biz = new Business();
        biz.setId(businessId);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(biz));

        Customer saved = new Customer(biz, "+919876543210", "Ananya Verma", "ananya@example.com");
        saved.setId(UUID.randomUUID());
        when(customerRepository.save(any(Customer.class))).thenReturn(saved);

        CustomerDto result = customerService.createCustomer(businessId, req);

        assertNotNull(result);
        assertEquals("+919876543210", result.getPhoneNumber());
        assertEquals("Ananya Verma", result.getName());
        assertEquals("ananya@example.com", result.getEmail());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    void createCustomer_WhenDuplicatePhone_ShouldThrowBadRequest() {
        UUID businessId = UUID.randomUUID();
        CreateCustomerRequest req = new CreateCustomerRequest("+919876543210", "Duplicate", null);
        when(customerRepository.existsByBusinessIdAndPhoneNumber(businessId, "+919876543210")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> customerService.createCustomer(businessId, req));
        verify(customerRepository, never()).save(any());
    }
}
