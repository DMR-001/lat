import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="w-container w-section">
            <h1 className="w-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>Contact Us</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>

                {/* Info */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Get in Touch</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ color: 'var(--w-primary)' }}><MapPin /></div>
                            <div>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Address</h3>
                                <p style={{ color: '#6b7280' }}>Hno-14-218/5, Raghavanagar Colony,<br />Meerpet, Hyderabad, Telangana</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ color: 'var(--w-primary)' }}><Phone /></div>
                            <div>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Phone</h3>
                                <p style={{ color: '#6b7280' }}>+91 70322 52030</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ color: 'var(--w-primary)' }}><Mail /></div>
                            <div>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Email</h3>
                                <p style={{ color: '#6b7280' }}>sproutmeerpet@gmail.com</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ color: 'var(--w-primary)' }}><Clock /></div>
                            <div>
                                <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Office Hours</h3>
                                <p style={{ color: '#6b7280' }}>Mon - Sat: 9:00 AM - 4:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Placeholder / Map */}
                <div style={{ backgroundColor: '#f9fafb', padding: '2rem', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Admissions Inquiry</h2>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="text" placeholder="Parent Name" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        <input type="tel" placeholder="Phone Number" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        <input type="text" placeholder="Child's Grade" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        <textarea placeholder="Message" rows={4} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}></textarea>
                        <button type="button" className="w-btn w-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Send Message</button>
                    </form>
                </div>

            </div>
        </div>
    );
}
