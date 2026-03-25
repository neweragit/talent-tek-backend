import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border-2 border-orange-100 rounded-2xl p-8 sm:p-10 shadow-sm">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: March 25, 2026</p>

            <div className="space-y-8 text-slate-700">
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Information We Collect</h2>
                <p>
                  We collect information you provide directly, such as account details, CV files, profile data, and
                  communication records.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">2. How We Use Information</h2>
                <p>
                  We use your information to operate the platform, match talents with opportunities, improve features,
                  and provide support.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Sharing of Information</h2>
                <p>
                  We only share information when needed to provide the service, comply with legal obligations, or
                  protect platform safety.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Data Retention</h2>
                <p>
                  We retain data for as long as required to operate the service, resolve disputes, and meet legal
                  requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Security</h2>
                <p>
                  We use reasonable technical and organizational measures to protect data. No method of transmission or
                  storage is fully secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Your Rights</h2>
                <p>
                  Depending on your location, you may have rights to access, correct, or delete your personal data and
                  to object to specific processing.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">7. Policy Updates</h2>
                <p>
                  We may update this privacy policy over time. Material updates will be posted on this page with a new
                  effective date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">8. Contact</h2>
                <p>If you have privacy questions, contact support through the platform help center.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
