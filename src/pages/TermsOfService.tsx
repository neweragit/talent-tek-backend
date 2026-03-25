import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border-2 border-orange-100 rounded-2xl p-8 sm:p-10 shadow-sm">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: March 25, 2026</p>

            <div className="space-y-8 text-slate-700">
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h2>
                <p>
                  By using this platform, you agree to these Terms of Service. If you do not agree, do not use the
                  platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Account Responsibilities</h2>
                <p>
                  You are responsible for keeping your account credentials secure and for all activity that happens
                  under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">3. User Content</h2>
                <p>
                  You keep ownership of your uploaded content (such as CVs and profile information). You grant us the
                  right to process and display that content to provide the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Acceptable Use</h2>
                <p>
                  You agree not to misuse the platform, attempt unauthorized access, upload malicious files, or submit
                  misleading information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Job and Hiring Disclaimer</h2>
                <p>
                  We provide a matching platform. We do not guarantee job offers, interviews, or hiring outcomes for
                  any user.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Termination</h2>
                <p>
                  We may suspend or terminate accounts that violate these terms, applicable laws, or platform
                  integrity requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">7. Changes to Terms</h2>
                <p>
                  We may update these terms from time to time. Continued use of the platform after updates means you
                  accept the revised terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">8. Contact</h2>
                <p>If you have questions about these terms, contact support through the platform help center.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
