import React from 'react';
import { Container, Grid, Typography, Divider } from '@mui/material';

export default function TermsOfService() {
  return (
    <Container sx={{ my: 6 }} maxWidth="md">
      <Grid container spacing={4} justifyContent="center">
        <Grid>
          <Typography variant="h4" gutterBottom textAlign="center">
            Terms of Service
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="body1" textAlign="justify">
            The ROBOKOP website (&lsquo;ROBOKOP&rsquo;) has been designed to provide you with access
            to biomedical exploration and inference tools developed by RENCI and CoVar LLC
            (hereafter referred to as the ‘ROBOKOP team’). The ROBOKOP team authorizes you to access
            and use ROBOKOP under the conditions set forth below.
            <br />
            <br />
            You agree that you will ensure that any copies of files or other documents you generate
            by using ROBOKOP shall retain and display all copyright, licensing, and other
            proprietary notices contained therein. The ROBOKOP team has attempted to provide
            accurate and current information on ROBOKOP. However, the team makes no representations
            or warranties that the information contained or published on ROBOKOP will be suitable
            for your specific purposes or for any other purposes. You agree to indemnify, defend,
            and hold the ROBOKOP team harmless from all claims, damages, liabilities, and expenses,
            including without limitation reasonable attorney&apos;s fees and costs, whether or not a
            lawsuit or other proceeding is filed, that in any way arises out of or relates to your
            use of ROBOKOP and/or use of the other third-party data or websites referenced herein.
            <br />
            <br />
            YOU ACKNOWLEDGE THAT ROBOKOP IS EXPERIMENTAL AND ACADEMIC IN NATURE, AND IT IS NOT
            LICENSED BY THE U.S. FOOD AND DRUG ADMINISTRATION OR ANY OTHER REGULATORY BODY. ROBOKOP
            IS PROVIDED &ldquo;AS-IS&rdquo; WITHOUT WARRANTY OF ANY KIND. The ROBOKOP TEAM MAKES NO
            REPRESENTATIONS OR WARRANTIES CONCERNING ROBOKOP OR ANY OTHER MATTER WHATSOEVER,
            INCLUDING WITHOUT LIMITATION ANY EXPRESS, IMPLIED, OR STATUTORY WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT OF THIRD-PARTY
            RIGHTS, TITLE, ACCURACY, COMPLETENESS, OR ARISING OUT OF COURSE OF CONDUCT OR TRADE
            CUSTOM OR USAGE, AND DISCLAIMS ALL SUCH EXPRESS, IMPLIED, OR STATUTORY WARRANTIES. THE
            ROBOKOP TEAM MAKES NO WARRANTY OR REPRESENTATION THAT YOUR USE OF ROBOKOP WILL NOT
            INFRINGE UPON THE INTELLECTUAL PROPERTY OR OTHER RIGHTS OF ANY THIRD PARTY. FURTHER, THE
            ROBOKOP TEAM SHALL NOT BE LIABLE IN ANY MANNER WHATSOEVER FOR ANY DIRECT, INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING OUT OF OR IN ANY WAY
            RELATED TO ROBOKOP, THE USE OF, OR INABILITY TO USE, ANY OF THE INFORMATION OR DATA
            CONTAINED OR REFERENCED IN THIS WEBSITE OR ANY INFORMATION OR DATA THAT IS PROVIDED
            THROUGH LINKED WEBSITES, OR ANY OTHER MATTER. THE FOREGOING EXCLUSIONS AND LIMITATIONS
            SHALL APPLY TO ALL CLAIMS AND ACTIONS OF ANY KIND AND ON ANY THEORY OF LIABILITY,
            WHETHER BASED ON CONTRACT, TORT, OR ANY OTHER GROUNDS, AND REGARDLESS OF WHETHER A PARTY
            HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND NOTWITHSTANDING ANY FAILURE OF
            ESSENTIAL PURPOSE OF ANY LIMITED REMEDY. BY USING THIS WEBSITE, YOU FURTHER AGREE THAT
            EACH WARRANTY DISCLAIMER, EXCLUSION OF DAMAGES, OR OTHER LIMITATION OF LIABILITY HEREIN
            IS INTENDED TO BE SEVERABLE AND INDEPENDENT OF THE OTHER CLAUSES OR SENTENCES BECAUSE
            THEY EACH REPRESENT SEPARATE ELEMENTS OF RISK ALLOCATION BETWEEN THE PARTIES.
            <br />
            <br />
            ROBOKOP may contain information from third-party websites, which may or may not be
            marked with the name of the source. Such information does not necessarily represent the
            views or opinions of the ROBOKOP team, and the team shall have no responsibility
            whatsoever for such information. All information from third-party websites is the sole
            responsibility of the person or entity that provides and/or maintains such websites. As
            a ROBOKOP user, you are solely responsible for any information that you display,
            generate, transmit, or transfer while using ROBOKOP and for the consequences of such
            actions.
            <br />
            <br />
            Should any ROBOKOP user provide general, scientific, or other feedback information,
            whether in the form of questions, comments, or suggestions to the ROBOKOP team,
            regarding the content of ROBOKOP website or otherwise, such information shall not be
            deemed to be confidential or proprietary to you or to any other party. The ROBOKOP team
            shall have no obligation of any kind with respect to such information and shall have the
            right, without limitation, to reproduce, use, disclose, merge, display, make derivatives
            of, and distribute such information to others. The ROBOKOP team shall also have the
            right, without limitation, to use and exploit such information, including ideas,
            concepts, know-how, inventions, techniques, or other materials contained in such
            information for any purpose whatsoever, including but not limited to, making changes or
            improvements to ROBOKOP and/or developing, manufacturing, marketing, selling, or
            distributing products and technologies incorporating such information. You agree that
            the ROBOKOP team has no obligation whatsoever to respond to your comments or to change
            or correct any information on ROBOKOP based on your comments.
            <br />
            <br />
            Gamma reserves the right to alter the content of ROBOKOP in any way, at any time and for
            any reason, with or without prior notice to you, and Gamma will not be liable in any way
            for possible consequences of such changes or for inaccuracies, typographical errors or
            omissions in the contents hereof. Nothing contained herein shall be construed as
            conferring by implication, estoppel or otherwise any license or right under any patent,
            trademark or other intellectual property of Gamma or any third party. Except as
            expressly provided above, nothing contained herein shall be construed as conferring any
            right or license under any Gamma copyrights.
            <br />
            <br />
            The ROBOKOP team also reserves the right to modify these Terms of Service at any time
            and for any reason, with or without prior notice to you. You should always review the
            most current Terms of Service herein before using this website. By using this website,
            you agree to the current Terms of Service posted on the site. You also agree that these
            Terms of Service constitute the entire agreement between you and the ROBOKOP team
            regarding the subject matter hereof and supersede all prior and contemporaneous
            understandings, oral or written, regarding such subject matter. In addition, if any
            provision of these Terms of Service is found by a court of competent jurisdiction to be
            invalid, void, or unenforceable, then the remaining provisions shall remain in full
            force and effect, and the affected provision shall be revised so as to reflect the
            original intent of the parties hereunder to the maximum extent permitted by applicable
            law.
            <br />
            <br />
            BY USING THE ROBOKOP WEBSITE, YOU ACKNOWLEDGE AND AGREE THAT YOU HAVE READ, UNDERSTOOD,
            AND AGREE TO ALL OF THE TERMS OF SERVICE DETAILED HEREIN.
          </Typography>
        </Grid>
      </Grid>
    </Container>
  );
}
