package com.smartreplyai.security;

import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final BusinessMemberRepository businessMemberRepository;

    public CustomUserDetailsService(UserRepository userRepository, BusinessMemberRepository businessMemberRepository) {
        this.userRepository = userRepository;
        this.businessMemberRepository = businessMemberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<BusinessMember> members = businessMemberRepository.findByUserId(user.getId());
        UUID defaultBusinessId = members.isEmpty() ? null : members.get(0).getBusiness().getId();

        return UserPrincipal.create(user, defaultBusinessId);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        List<BusinessMember> members = businessMemberRepository.findByUserId(user.getId());
        UUID defaultBusinessId = members.isEmpty() ? null : members.get(0).getBusiness().getId();

        return UserPrincipal.create(user, defaultBusinessId);
    }
}
