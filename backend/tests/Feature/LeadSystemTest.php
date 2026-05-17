<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Lead;

class LeadSystemTest extends TestCase
{
    use RefreshDatabase; // يقوم بتهيئة قاعدة بيانات اختبار نظيفة لكل مرة

    public function test_a_user_can_submit_a_lead_successfully()
    {
        $leadData = [
            'name' => 'Test User',
            'business_name' => 'Test Business',
            'business_type' => 'salon',
            'email' => 'test@example.com',
            'phone' => '01234567890',
            'governorate' => 'Cairo',
            'interest_type' => 'salon'
        ];

        $response = $this->postJson('/api/leads', $leadData);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'lead']);

        $this->assertDatabaseHas('leads', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '01234567890'
        ]);
    }

    public function test_submission_fails_if_required_fields_are_missing()
    {
        $invalidData = [
            'name' => 'Incomplete User',
            // Missing phone and email
        ];

        $response = $this->postJson('/api/leads', $invalidData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['phone', 'email', 'business_name', 'business_type', 'governorate', 'interest_type']);
    }

    public function test_email_must_be_a_valid_format()
    {
        $badEmailData = [
            'name' => 'Bad Email User',
            'business_name' => 'Business',
            'business_type' => 'salon',
            'email' => 'not-an-email', // Wrong format
            'phone' => '01234567890',
            'governorate' => 'Cairo',
            'interest_type' => 'salon'
        ];

        $response = $this->postJson('/api/leads', $badEmailData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }
}
