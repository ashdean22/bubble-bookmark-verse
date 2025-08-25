import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Scale, UserCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-body">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-purple-300 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to BubbleLink
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <Scale className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-4xl font-brand font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-purple-300 text-lg">
              The terms and conditions for using BubbleLink
            </p>
            <p className="text-purple-400 text-sm mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 rounded-lg border border-purple-500/30 p-8 space-y-8">
          
          <section>
            <div className="flex items-center mb-4">
              <UserCheck className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-brand font-semibold text-white">Acceptance of Terms</h2>
            </div>
            <div className="text-purple-200 space-y-4">
              <p>
                By accessing and using BubbleLink, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-brand font-semibold text-white">Service Description</h2>
            </div>
            <div className="text-purple-200 space-y-4">
              <p>
                BubbleLink is a bookmark management service that allows users to save and organize 
                their favorite websites as interactive floating bubbles. The service includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Free tier with up to 5 bookmarks</li>
                <li>Premium tiers with unlimited bookmarks and additional features</li>
                <li>Local storage and optional cloud synchronization</li>
                <li>Custom themes and visual effects</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">User Responsibilities</h2>
            <div className="text-purple-200 space-y-4">
              <p>As a user of BubbleLink, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service in compliance with applicable laws</li>
                <li>Not share copyrighted content without permission</li>
                <li>Not use the service for illegal or harmful purposes</li>
                <li>Respect the intellectual property rights of others</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Subscription Terms</h2>
            <div className="text-purple-200 space-y-4">
              <p>For premium subscriptions:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subscriptions are billed monthly or annually</li>
                <li>You can cancel your subscription at any time</li>
                <li>Refunds are available within 30 days of purchase</li>
                <li>Features are subject to your active subscription status</li>
                <li>Price changes will be communicated 30 days in advance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Data and Privacy</h2>
            <div className="text-purple-200 space-y-4">
              <p>
                Your privacy is important to us. By using BubbleLink, you agree to our data 
                handling practices as outlined in our Privacy Policy. Key points:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your bookmarks are stored locally by default</li>
                <li>Cloud sync requires explicit consent</li>
                <li>We don't sell your personal data</li>
                <li>You can export or delete your data at any time</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-brand font-semibold text-white">Limitations and Disclaimers</h2>
            </div>
            <div className="text-purple-200 space-y-4">
              <p>
                BubbleLink is provided "as is" without any warranties. We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Loss of bookmarks due to browser data clearing</li>
                <li>Service interruptions or downtime</li>
                <li>Content or availability of linked websites</li>
                <li>Any damages arising from use of the service</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Termination</h2>
            <div className="text-purple-200 space-y-4">
              <p>
                We reserve the right to terminate or suspend your access to the service at any time 
                for violations of these terms. You may also terminate your account at any time by 
                contacting us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Changes to Terms</h2>
            <div className="text-purple-200 space-y-4">
              <p>
                We reserve the right to modify these terms at any time. Users will be notified 
                of significant changes via email or through the service interface.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-brand font-semibold text-white mb-4">Contact Information</h2>
            <div className="text-purple-200">
              <p>
                For questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@bubblelink.app" className="text-purple-400 hover:text-purple-300">
                  legal@bubblelink.app
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;